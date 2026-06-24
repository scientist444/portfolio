/*
 * ═══════════════════════════════════════════════════════════════════════
 *  PPG_Advanced.h — Ultra-Robust Wrist PPG Processing Engine
 *  For MAX30102 + MPU6050 on ESP32-S3
 *
 *  Pipeline (per sample):
 *    Slow-EMA DC removal → 2nd-order Butterworth BP (0.5–4 Hz)
 *    → Normalised-LMS motion ANC (IMU reference)
 *    → Circular buffer → [every 256 samples]:
 *        FFT spectral HR + Kalman smoothing
 *        Peak detection → RR intervals → HRV (RMSSD, SDNN)
 *        SpO2 from AC/DC ratios (Beer–Lambert)
 *        Multi-factor confidence (SNR + motion + HR consistency)
 *        Perfusion index
 *
 *  Effective sample rate assumed: 100 Hz (MAX30102 @ 400 sps / 4 avg)
 *  All filter coefficients designed for fs = 100 Hz.
 * ═══════════════════════════════════════════════════════════════════════
 */
#pragma once
#include <Arduino.h>
#include <math.h>

// ─── Configuration ────────────────────────────────────────────────────────
#define PPGA_FS          100.0f   // Effective sensor sample rate (Hz)
#define PPGA_FFT_N       256      // Signal buffer size (samples)
#define PPGA_FFT_WORK    512      // Zero-padded FFT size → 2× freq resolution (0.195 Hz/bin)
#define PPGA_HR_MIN      40.0f   // BPM minimum
#define PPGA_HR_MAX      240.0f  // BPM maximum
#define PPGA_LMS_TAPS    16      // NLMS adaptive filter length
#define PPGA_LMS_MU      0.005f  // NLMS step size (conservative)
#define PPGA_RR_BUF      24      // RR-interval history depth
#define PPGA_DC_POLE     0.995f  // Slow-EMA pole for DC tracker
#define PPGA_CONTACT_THR 8000.0f // Min DC count to confirm skin contact
#define PPGA_MIN_AC      30.0f   // Min AC amplitude (counts) to be a valid beat

// Pre-warped 2nd-order Butterworth HP at 0.5 Hz, fs=100 Hz
// b = [0.97800, -1.95600, 0.97800], a = [1, -1.95551, 0.95653]
#define HP_B0  0.97800f
#define HP_B1 -1.95600f
#define HP_B2  0.97800f
#define HP_A1 -1.95551f
#define HP_A2  0.95653f

// Pre-warped 2nd-order Butterworth LP at 4 Hz, fs=100 Hz
// b = [0.013422, 0.026844, 0.013422], a = [1, -1.64649, 0.70022]
#define LP_B0  0.013422f
#define LP_B1  0.026844f
#define LP_B2  0.013422f
#define LP_A1 -1.64649f
#define LP_A2  0.70022f

// ─── Biquad (Direct Form II) ──────────────────────────────────────────────
struct Biquad {
    float b0, b1, b2;
    float a1, a2;
    float s1 = 0, s2 = 0;

    void init(float _b0, float _b1, float _b2, float _a1, float _a2) {
        b0=_b0; b1=_b1; b2=_b2; a1=_a1; a2=_a2; s1=s2=0.f;
    }
    inline float tick(float x) {
        float v = x - a1*s1 - a2*s2;
        float y = b0*v + b1*s1 + b2*s2;
        s2=s1; s1=v;
        return y;
    }
    void reset() { s1=s2=0.f; }
};

// ─── Output structure ─────────────────────────────────────────────────────
struct PPGVitals {
    float   hr;          // Heart rate (BPM), Kalman-smoothed
    float   spo2;        // Blood oxygen saturation (%)
    float   rmssd;       // HRV — Root Mean Square of Successive Differences (ms)
    float   sdnn;        // HRV — Standard Deviation of NN intervals (ms)
    float   confidence;  // Measurement confidence 0–100 %
    float   pi;          // Perfusion Index = AC/DC × 100 %
    float   snr_db;      // Spectral SNR of dominant HR peak (dB)
    uint8_t motion;      // 0=static 1=micro 2=periodic 3=chaotic
    bool    contact;     // true if sensor is on skin
    bool    valid;       // true when confidence > 30 and ≥4 RR intervals
};

// ═══════════════════════════════════════════════════════════════════════════
//  PPGAdvanced — main processing class
// ═══════════════════════════════════════════════════════════════════════════
class PPGAdvanced {
public:
    void begin();

    // Call once per raw sample with all sensor readings.
    void feed(uint32_t ir, uint32_t red,
              float ax, float ay, float az,
              float gx, float gy, float gz);

    // Returns true (once per update cycle, ~2.56 s) when new vitals are ready.
    bool vitalsReady() { bool r=_ready; _ready=false; return r; }

    // Accessors
    const PPGVitals& getVitals() const { return _v; }
    float ppgAC()  const { return _irAC; }  // latest filtered AC sample
    float getIrDC() const { return _irDC; }
    float getRedDC() const { return _redDC; }

private:
    // ── Circular sample buffers ──────────────────────────────────────
    float _irBuf [PPGA_FFT_N];
    float _redBuf[PPGA_FFT_N];
    float _imuBuf[PPGA_FFT_N];   // band-limited accel+gyro motion reference
    int   _head;                 // next write index
    int   _filled;               // samples since last full-update

    // ── DC trackers (slow EMA) ───────────────────────────────────────
    float _irDC, _redDC, _imuMag;
    bool  _dcInit;

    // ── Latest per-sample outputs ────────────────────────────────────
    float _irAC;

    // ── Bandpass filters (HP→LP per channel) ────────────────────────
    Biquad _hpIR, _lpIR;
    Biquad _hpRed, _lpRed;
    Biquad _hpIMU, _lpIMU;

    // ── Running AC amplitude trackers (slow-decay max) ───────────────
    float _irPeak, _redPeak;

    // ── NLMS adaptive filter ─────────────────────────────────────────
    float _lmsW[PPGA_LMS_TAPS];
    float _lmsX[PPGA_LMS_TAPS];  // reference delay line
    int   _lmsXIdx;

    // ── Peak detector state ──────────────────────────────────────────
    struct PkState {
        float hi, lo, thr, prev;
        bool  armed;
        float lastSampleIdx;
        float rr[PPGA_RR_BUF];
        int   rrHead, rrCnt;
    } _pk;

    // ── Kalman (1-D state = HR in BPM) ──────────────────────────────
    float _kHR, _kP;
    bool  _kInit;

    // ── 5-tap median output filter (removes single-update spikes) ────
    float _medBuf[5];
    int   _medIdx, _medCnt;

    // ── Welford online variance for motion ───────────────────────────
    float _wMean, _wM2;
    int   _wN;
    float _accelVar;

    // ── Total sample counter ─────────────────────────────────────────
    uint32_t _nTotal;

    // ── FFT work arrays (sized for zero-padded PPGA_FFT_WORK) ───────
    float _fR[PPGA_FFT_WORK];
    float _fI[PPGA_FFT_WORK];

    // ── Output ───────────────────────────────────────────────────────
    PPGVitals _v;
    bool      _ready;

    // ── Private methods ──────────────────────────────────────────────
    void   _initFilters();
    void   _updateMotionVar(float mag);
    uint8_t _motionState() const;
    float  _nlms(float desired, float ref);
    void   _detectPeak(float x);
    void   _fft(float* re, float* im, int n);
    float  _findHRfromFFT(float &snr_db_out);
    void   _computeHRV(float &rmssd, float &sdnn);
    float  _computeSpO2();
    float  _kalman(float meas, float R);
    float  _medianFilter(float hr);
    float  _computeConfidence(float snr, float fftHR, float peakHR, uint8_t mot);
    void   _fullUpdate();
};

// ═══════════════════════════════════════════════════════════════════════════
//  Implementation (inline, single-header for Arduino)
// ═══════════════════════════════════════════════════════════════════════════

inline void PPGAdvanced::begin() {
    memset(_irBuf,  0, sizeof _irBuf);
    memset(_redBuf, 0, sizeof _redBuf);
    memset(_imuBuf, 0, sizeof _imuBuf);
    _head = _filled = 0;

    _irDC = _redDC = _imuMag = 0.f;
    _dcInit = false;
    _irAC = 0.f;

    _initFilters();

    _irPeak = _redPeak = 0.f;

    memset(_lmsW, 0, sizeof _lmsW);
    memset(_lmsX, 0, sizeof _lmsX);
    _lmsXIdx = 0;

    memset(&_pk, 0, sizeof _pk);

    _kHR = 75.f; _kP = 200.f; _kInit = false;
    memset(_medBuf, 0, sizeof _medBuf); _medIdx = _medCnt = 0;
    _wMean = _wM2 = 0.f; _wN = 0; _accelVar = 0.f;
    _nTotal = 0;

    memset(&_v, 0, sizeof _v);
    _ready = false;
}

// ─── Bandpass filter initialisation ───────────────────────────────────────
inline void PPGAdvanced::_initFilters() {
    _hpIR .init(HP_B0, HP_B1, HP_B2, HP_A1, HP_A2);
    _lpIR .init(LP_B0, LP_B1, LP_B2, LP_A1, LP_A2);
    _hpRed.init(HP_B0, HP_B1, HP_B2, HP_A1, HP_A2);
    _lpRed.init(LP_B0, LP_B1, LP_B2, LP_A1, LP_A2);
    _hpIMU.init(HP_B0, HP_B1, HP_B2, HP_A1, HP_A2);
    _lpIMU.init(LP_B0, LP_B1, LP_B2, LP_A1, LP_A2);
}

// ─── Welford online variance (resets at 200 samples to stay recent) ────────
inline void PPGAdvanced::_updateMotionVar(float mag) {
    _wN++;
    float delta = mag - _wMean;
    _wMean += delta / (float)_wN;
    _wM2   += delta * (mag - _wMean);
    if (_wN > 1) _accelVar = _wM2 / (float)(_wN - 1);
    if (_wN >= 200) { _wN = 50; _wM2 = _accelVar * 49.f; }
}

inline uint8_t PPGAdvanced::_motionState() const {
    if (_accelVar < 0.002f) return 0;   // static
    if (_accelVar < 0.05f)  return 1;   // micro-motion (typing, small shifts)
    if (_accelVar < 0.50f)  return 2;   // periodic (walking)
    return 3;                            // chaotic (exercise)
}

// ─── Normalised-LMS adaptive motion cancellation ──────────────────────────
// desired = noisy bandpass PPG,  ref = bandpass IMU magnitude
// Returns cleaned PPG (noise component removed).
inline float PPGAdvanced::_nlms(float desired, float ref) {
    _lmsX[_lmsXIdx] = ref;

    float noise = 0.f;
    for (int k = 0; k < PPGA_LMS_TAPS; k++) {
        int i = (_lmsXIdx - k + PPGA_LMS_TAPS) % PPGA_LMS_TAPS;
        noise += _lmsW[k] * _lmsX[i];
    }

    float err = desired - noise;

    float power = 1e-8f;
    for (int k = 0; k < PPGA_LMS_TAPS; k++) power += _lmsX[k] * _lmsX[k];
    float mu_n = PPGA_LMS_MU / power;

    for (int k = 0; k < PPGA_LMS_TAPS; k++) {
        int i = (_lmsXIdx - k + PPGA_LMS_TAPS) % PPGA_LMS_TAPS;
        _lmsW[k] += mu_n * err * _lmsX[i];
    }

    _lmsXIdx = (_lmsXIdx + 1) % PPGA_LMS_TAPS;
    return err;
}

// ─── Adaptive-threshold peak detector (rising-edge crossing) ──────────────
// Detects systolic peaks; stores RR intervals in samples.
inline void PPGAdvanced::_detectPeak(float x) {
    // Slow-decay max/min envelope for AC signal centred near 0
    _pk.hi = (x > _pk.hi) ? x : _pk.hi * 0.9985f;
    _pk.lo = (x < _pk.lo) ? x : _pk.lo * 0.9985f;

    float range = _pk.hi - _pk.lo;
    if (range < PPGA_MIN_AC) { _pk.prev = x; return; }

    // Threshold at 55 % of positive peak (robust against baseline shifts)
    _pk.thr = _pk.hi * 0.55f;

    const float minRR = PPGA_FS * 60.f / PPGA_HR_MAX;
    const float maxRR = PPGA_FS * 60.f / PPGA_HR_MIN;

    // Rising-edge crossing detection
    if (_pk.prev < _pk.thr && x >= _pk.thr) {
        float dt = (float)_nTotal - _pk.lastSampleIdx;
        if (_pk.lastSampleIdx > 0 && dt >= minRR && dt <= maxRR) {
            _pk.rr[_pk.rrHead] = dt;
            _pk.rrHead = (_pk.rrHead + 1) % PPGA_RR_BUF;
            if (_pk.rrCnt < PPGA_RR_BUF) _pk.rrCnt++;
        }
        _pk.lastSampleIdx = (float)_nTotal;
    }
    _pk.prev = x;
}

// ─── Cooley–Tukey in-place FFT (radix-2 DIT) ─────────────────────────────
inline void PPGAdvanced::_fft(float* re, float* im, int n) {
    // Bit-reversal permutation
    for (int i = 1, j = 0; i < n; i++) {
        int bit = n >> 1;
        for (; j & bit; bit >>= 1) j ^= bit;
        j ^= bit;
        if (i < j) {
            float t;
            t=re[i]; re[i]=re[j]; re[j]=t;
            t=im[i]; im[i]=im[j]; im[j]=t;
        }
    }
    // Butterfly stages
    for (int len = 2; len <= n; len <<= 1) {
        float ang = -(float)M_PI * 2.f / (float)len;
        float wRe = cosf(ang), wIm = sinf(ang);
        for (int i = 0; i < n; i += len) {
            float uRe = 1.f, uIm = 0.f;
            for (int j = 0; j < len >> 1; j++) {
                int p = i+j, q = i+j+(len>>1);
                float tRe = uRe*re[q] - uIm*im[q];
                float tIm = uRe*im[q] + uIm*re[q];
                re[q] = re[p] - tRe;  im[q] = im[p] - tIm;
                re[p] += tRe;          im[p] += tIm;
                float nu = uRe*wRe - uIm*wIm;
                uIm     = uRe*wIm + uIm*wRe;
                uRe     = nu;
            }
        }
    }
}

// ─── FFT-based HR estimation — zero-padded for 2× frequency resolution ────
// Signal: PPGA_FFT_N samples (256) with Hann window
// FFT:    PPGA_FFT_WORK points (512) via zero-padding → 0.195 Hz/bin
// Resolution: ~12 BPM/bin before parabolic interpolation (was 23 BPM/bin)
inline float PPGAdvanced::_findHRfromFFT(float &snr_db_out) {
    const int nsig = PPGA_FFT_N;   // 256 real samples
    const int nfft = PPGA_FFT_WORK; // 512 zero-padded FFT
    snr_db_out = 0.f;

    // Fill signal with Hann window; zero-pad remainder
    for (int i = 0; i < nfft; i++) {
        if (i < nsig) {
            int src = (_head - nsig + i + nsig) % nsig;
            // Hann window: 0.5*(1 - cos(2π·i/(N-1)))
            float w = 0.5f * (1.f - cosf(2.f * (float)M_PI * i / (float)(nsig - 1)));
            _fR[i] = _irBuf[src] * w;
        } else {
            _fR[i] = 0.f;   // zero-padding
        }
        _fI[i] = 0.f;
    }

    _fft(_fR, _fI, nfft);

    // Magnitude of first half using zero-padded frequency resolution
    const float freqRes = PPGA_FS / (float)nfft;   // 100/512 = 0.195 Hz
    int binMin = (int)ceilf(PPGA_HR_MIN / 60.f / freqRes);
    int binMax = (int)floorf(PPGA_HR_MAX / 60.f / freqRes);
    binMin = max(binMin, 1);
    binMax = min(binMax, nfft/2 - 1);

    // Use nfft for variable n below
    const int n = nfft;

    // Find dominant peak in HR band
    int   pkBin = binMin;
    float pkVal = 0.f;
    for (int i = binMin; i <= binMax; i++) {
        float mag = sqrtf(_fR[i]*_fR[i] + _fI[i]*_fI[i]);
        if (mag > pkVal) { pkVal = mag; pkBin = i; }
    }
    if (pkVal < 1e-9f) return _kHR;   // return last estimate

    // Parabolic interpolation for sub-bin frequency precision
    float pf = (float)pkBin;
    if (pkBin > binMin && pkBin < binMax) {
        float L = sqrtf(_fR[pkBin-1]*_fR[pkBin-1] + _fI[pkBin-1]*_fI[pkBin-1]);
        float C = pkVal;
        float R = sqrtf(_fR[pkBin+1]*_fR[pkBin+1] + _fI[pkBin+1]*_fI[pkBin+1]);
        float denom = 2.f * (2.f*C - L - R);
        if (fabsf(denom) > 1e-6f) pf += (L - R) / denom;
    }

    // SNR = peak power / mean noise-floor in band (excluding ±2 bins around peak)
    float noiseSum = 0.f; int noiseCnt = 0;
    for (int i = binMin; i <= binMax; i++) {
        if (abs(i - pkBin) > 2) {
            float m = sqrtf(_fR[i]*_fR[i] + _fI[i]*_fI[i]);
            noiseSum += m; noiseCnt++;
        }
    }
    float noiseFloor = (noiseCnt > 0) ? noiseSum/(float)noiseCnt : 1e-9f;
    if (noiseFloor < 1e-12f) noiseFloor = 1e-12f;
    snr_db_out = 20.f * log10f(pkVal / noiseFloor);

    return pf * freqRes * 60.f;   // Hz → BPM
}

// ─── HRV: RMSSD and SDNN from stored RR intervals ─────────────────────────
inline void PPGAdvanced::_computeHRV(float &rmssd, float &sdnn) {
    rmssd = sdnn = 0.f;
    if (_pk.rrCnt < 4) return;

    // Collect RR intervals [samples] → [ms], filter physiologically implausible
    float ms[PPGA_RR_BUF];
    int cnt = 0;
    for (int i = 0; i < _pk.rrCnt; i++) {
        int idx = (_pk.rrHead - _pk.rrCnt + i + PPGA_RR_BUF) % PPGA_RR_BUF;
        float rr_ms = _pk.rr[idx] / PPGA_FS * 1000.f;
        if (rr_ms > 250.f && rr_ms < 1600.f) ms[cnt++] = rr_ms;
    }
    if (cnt < 3) return;

    // Mean
    float mean = 0.f;
    for (int i = 0; i < cnt; i++) mean += ms[i];
    mean /= (float)cnt;

    // SDNN = std(RR)
    float varSum = 0.f;
    for (int i = 0; i < cnt; i++) varSum += (ms[i]-mean)*(ms[i]-mean);
    sdnn = sqrtf(varSum / (float)(cnt - 1));

    // RMSSD = sqrt(mean(diff^2))
    float ssq = 0.f;
    for (int i = 1; i < cnt; i++) { float d = ms[i]-ms[i-1]; ssq += d*d; }
    rmssd = sqrtf(ssq / (float)(cnt - 1));
}

// ─── SpO2 via Beer–Lambert R-ratio (empirical) ────────────────────────────
inline float PPGAdvanced::_computeSpO2() {
    if (_irDC < PPGA_CONTACT_THR || _redDC < 100.f || _irPeak < 1.f) return 0.f;
    float piIR  = _irPeak  / _irDC;
    float piRed = _redPeak / _redDC;
    if (piIR < 1e-6f) return 0.f;
    float R = piRed / piIR;
    // Empirical: SpO2 ≈ 110 − 25·R  (valid R ≈ 0.4–1.0)
    float spo2 = 110.f - 25.f * R;
    return constrain(spo2, 80.f, 100.f);
}

// ─── 1-D Kalman filter for HR ─────────────────────────────────────────────
inline float PPGAdvanced::_kalman(float meas, float R) {
    const float Q = 0.12f;
    if (!_kInit) { _kHR = meas; _kP = R; _kInit = true; return meas; }
    _kP += Q;
    float K  = _kP / (_kP + R);
    _kHR    += K * (meas - _kHR);
    _kP     *= (1.f - K);
    return _kHR;
}

// ── 5-tap median filter on Kalman output ──────────────────────────────────
inline float PPGAdvanced::_medianFilter(float hr) {
    _medBuf[_medIdx] = hr;
    _medIdx = (_medIdx + 1) % 5;
    if (_medCnt < 5) _medCnt++;

    // Sort a local copy and return middle element
    float tmp[5];
    int n = _medCnt;
    for (int i = 0; i < n; i++) tmp[i] = _medBuf[i];
    for (int i = 0; i < n-1; i++)
        for (int j = i+1; j < n; j++)
            if (tmp[j] < tmp[i]) { float t=tmp[i]; tmp[i]=tmp[j]; tmp[j]=t; }
    return tmp[n / 2];
}

// ─── Multi-factor confidence score (0–100) ────────────────────────────────
inline float PPGAdvanced::_computeConfidence(float snr, float fftHR,
                                              float peakHR, uint8_t mot) {
    // SNR contribution: 0 dB → 0 %, 30 dB → 100 %
    float snrScore  = constrain(snr / 30.f * 100.f, 0.f, 100.f);

    // FFT vs peak agreement (within ±15 BPM = full score)
    float agreeScore = 50.f;
    if (peakHR > 0.f) {
        float diff = fabsf(fftHR - peakHR);
        agreeScore = constrain((1.f - diff / 15.f) * 100.f, 0.f, 100.f);
    }

    // Motion penalty: static=100, chaotic=20
    float motScore = 100.f - (float)mot * 20.f;

    // Weighted sum
    float conf = 0.45f*snrScore + 0.30f*agreeScore + 0.25f*motScore;
    return constrain(conf, 0.f, 100.f);
}

// ─── Full vitals update (runs every PPGA_FFT_N samples ≈ 2.56 s) ──────────
inline void PPGAdvanced::_fullUpdate() {
    float snr   = 0.f;
    float fftHR = _findHRfromFFT(snr);
    fftHR = constrain(fftHR, PPGA_HR_MIN, PPGA_HR_MAX);

    // Peak-based HR from recent RR intervals (use last 8 to reduce noise)
    float peakHR = 0.f;
    if (_pk.rrCnt >= 3) {
        int cnt = min(_pk.rrCnt, 8);
        float sumRR = 0.f;
        for (int i = 0; i < cnt; i++) {
            int idx = (_pk.rrHead - cnt + i + PPGA_RR_BUF) % PPGA_RR_BUF;
            sumRR += _pk.rr[idx];
        }
        peakHR = 60.f * PPGA_FS / (sumRR / (float)cnt);
        peakHR = constrain(peakHR, PPGA_HR_MIN, PPGA_HR_MAX);
    }

    // Fuse FFT and peak estimates (weight by SNR)
    float meas, measR;
    if (peakHR > 0.f && snr > 5.f) {
        float wFFT = constrain(snr / 30.f, 0.3f, 0.7f);
        meas  = wFFT*fftHR + (1.f-wFFT)*peakHR;
        measR = 15.f;
    } else if (peakHR > 0.f) {
        meas  = peakHR;
        measR = 40.f;
    } else {
        meas  = fftHR;
        measR = 60.f;
    }

    float hr = _kalman(meas, measR);

    float rmssd=0, sdnn=0;
    _computeHRV(rmssd, sdnn);

    float spo2    = _computeSpO2();
    uint8_t mot   = _motionState();
    float pi      = (_irDC > 1.f) ? (_irPeak / _irDC * 100.f) : 0.f;
    float conf    = _computeConfidence(snr, fftHR, peakHR, mot);
    bool  contact = (_irDC >= PPGA_CONTACT_THR);

    _v.hr         = hr;
    _v.spo2       = spo2;
    _v.rmssd      = rmssd;
    _v.sdnn       = sdnn;
    _v.confidence = conf;
    _v.pi         = pi;
    _v.snr_db     = snr;
    _v.motion     = mot;
    _v.contact    = contact;
    _v.valid      = contact && (conf > 30.f) && (_pk.rrCnt >= 3);

    _ready = true;
}

// ─── Main per-sample entry point ──────────────────────────────────────────
inline void PPGAdvanced::feed(uint32_t ir, uint32_t red,
                               float ax, float ay, float az,
                               float gx, float gy, float gz) {
    float irF  = (float)ir;
    float redF = (float)red;
    float accelMag  = sqrtf(ax*ax + ay*ay + az*az);
    float gyroMag   = sqrtf(gx*gx + gy*gy + gz*gz);
    float motionMag = accelMag + 0.20f * gyroMag;

    // ── 1. DC tracking (slow EMA at ~0.08 Hz 3dB) ──────────────────
    if (!_dcInit) {
        _irDC = irF; _redDC = redF; _imuMag = motionMag;
        _dcInit = true;
    }
    _irDC  = PPGA_DC_POLE * _irDC  + (1.f - PPGA_DC_POLE) * irF;
    _redDC = PPGA_DC_POLE * _redDC + (1.f - PPGA_DC_POLE) * redF;
    _imuMag = PPGA_DC_POLE * _imuMag + (1.f - PPGA_DC_POLE) * motionMag;

    // ── 2. AC extraction + bandpass filtering (0.5–4 Hz) ────────────
    float irRaw   = irF   - _irDC;
    float redRaw  = redF  - _redDC;
    float imuRaw  = motionMag - _imuMag;

    float irFilt  = _lpIR .tick(_hpIR .tick(irRaw));
    float redFilt = _lpRed.tick(_hpRed.tick(redRaw));
    float imuFilt = _lpIMU.tick(_hpIMU.tick(imuRaw));

    // ── 3. Motion statistics ────────────────────────────────────────
    _updateMotionVar(motionMag);

    // ── 4. NLMS motion cancellation (only when motion detected) ─────
    float irClean = irFilt;
    if (_wN >= 30 && _motionState() >= 2) {
        irClean = _nlms(irFilt, imuFilt);
    }

    // ── 5. Slow-decay AC amplitude tracker (for SpO2 / PI) ──────────
    const float PKD = 0.9992f;   // ~1.4 s decay at 100 Hz
    _irPeak  = fmaxf(fabsf(irClean), _irPeak  * PKD);
    _redPeak = fmaxf(fabsf(redFilt), _redPeak * PKD);

    // ── 6. Write to circular buffer ─────────────────────────────────
    _irBuf [_head] = irClean;
    _redBuf[_head] = redFilt;
    _imuBuf[_head] = imuFilt;
    _head  = (_head + 1) % PPGA_FFT_N;
    _irAC  = irClean;

    _nTotal++;

    // ── 7. Peak detection → RR intervals ────────────────────────────
    _detectPeak(irClean);

    // ── 8. Full spectral update every PPGA_FFT_N samples ────────────
    _filled++;
    if (_filled >= PPGA_FFT_N) {
        _filled = 0;
        if (_irDC >= PPGA_CONTACT_THR) {
            _fullUpdate();
        } else {
            // No contact — report invalid
            _v = {};
            _v.contact = false;
            _v.valid   = false;
            _ready     = true;
        }
    }
}
