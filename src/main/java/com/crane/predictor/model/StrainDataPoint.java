package com.crane.predictor.model;

import java.time.LocalDateTime;

public class StrainDataPoint {
    private LocalDateTime timestamp;
    private double strain;
    private boolean aboveThreshold;

    public StrainDataPoint(LocalDateTime timestamp, double strain, boolean aboveThreshold) {
        this.timestamp = timestamp;
        this.strain = strain;
        this.aboveThreshold = aboveThreshold;
    }

    public LocalDateTime getTimestamp() { return timestamp; }
    public double getStrain() { return strain; }
    public boolean isAboveThreshold() { return aboveThreshold; }
}