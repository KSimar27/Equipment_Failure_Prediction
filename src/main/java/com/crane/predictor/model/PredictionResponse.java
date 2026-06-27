package com.crane.predictor.model;

import java.util.List;
import java.util.Map;

public class PredictionResponse {

    // Prediction results
    private String predictedFailureTimestamp;
    private String actualFailureTimestamp;
    private String status;           // CRITICAL, WARNING, STABLE
    private double confidence;       // 0-100%
    private double minutesToFailure;

    // Current ML features
    private double currentIntensity;
    private double currentGrowth;
    private double currentWindowSum;
    private double baseline;

    // Summary stats
    private int totalHighStrainIntervals;
    private int totalDataPoints;
    private double averageStrainRate;  // events per hour
    private double peakStrainValue;
    private String dataStartTime;
    private String dataEndTime;

    // Chart data: hourly event counts over time
    private List<Map<String, Object>> hourlyEventSeries;

    // Sliding window progression (intensity over time)
    private List<Map<String, Object>> intensityTimeline;

    // Raw CSV preview rows
    private List<Map<String, Object>> rawDataPreview;

    // Error info if parsing failed
    private String errorMessage;
    private boolean success;

    // ── Constructors ──────────────────────────────────────────────────────────

    public PredictionResponse() {}

    // ── Getters / Setters ─────────────────────────────────────────────────────

    public String getPredictedFailureTimestamp() { return predictedFailureTimestamp; }
    public void setPredictedFailureTimestamp(String v) { this.predictedFailureTimestamp = v; }

    public String getActualFailureTimestamp() { return actualFailureTimestamp; }
    public void setActualFailureTimestamp(String v) { this.actualFailureTimestamp = v; }

    public String getStatus() { return status; }
    public void setStatus(String v) { this.status = v; }

    public double getConfidence() { return confidence; }
    public void setConfidence(double v) { this.confidence = v; }

    public double getMinutesToFailure() { return minutesToFailure; }
    public void setMinutesToFailure(double v) { this.minutesToFailure = v; }

    public double getCurrentIntensity() { return currentIntensity; }
    public void setCurrentIntensity(double v) { this.currentIntensity = v; }

    public double getCurrentGrowth() { return currentGrowth; }
    public void setCurrentGrowth(double v) { this.currentGrowth = v; }

    public double getCurrentWindowSum() { return currentWindowSum; }
    public void setCurrentWindowSum(double v) { this.currentWindowSum = v; }

    public double getBaseline() { return baseline; }
    public void setBaseline(double v) { this.baseline = v; }

    public int getTotalHighStrainIntervals() { return totalHighStrainIntervals; }
    public void setTotalHighStrainIntervals(int v) { this.totalHighStrainIntervals = v; }

    public int getTotalDataPoints() { return totalDataPoints; }
    public void setTotalDataPoints(int v) { this.totalDataPoints = v; }

    public double getAverageStrainRate() { return averageStrainRate; }
    public void setAverageStrainRate(double v) { this.averageStrainRate = v; }

    public double getPeakStrainValue() { return peakStrainValue; }
    public void setPeakStrainValue(double v) { this.peakStrainValue = v; }

    public String getDataStartTime() { return dataStartTime; }
    public void setDataStartTime(String v) { this.dataStartTime = v; }

    public String getDataEndTime() { return dataEndTime; }
    public void setDataEndTime(String v) { this.dataEndTime = v; }

    public List<Map<String, Object>> getHourlyEventSeries() { return hourlyEventSeries; }
    public void setHourlyEventSeries(List<Map<String, Object>> v) { this.hourlyEventSeries = v; }

    public List<Map<String, Object>> getIntensityTimeline() { return intensityTimeline; }
    public void setIntensityTimeline(List<Map<String, Object>> v) { this.intensityTimeline = v; }

    public List<Map<String, Object>> getRawDataPreview() { return rawDataPreview; }
    public void setRawDataPreview(List<Map<String, Object>> v) { this.rawDataPreview = v; }

    public String getErrorMessage() { return errorMessage; }
    public void setErrorMessage(String v) { this.errorMessage = v; }

    public boolean isSuccess() { return success; }
    public void setSuccess(boolean v) { this.success = v; }
}