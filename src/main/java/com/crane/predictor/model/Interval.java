package com.crane.predictor.model;

import java.time.LocalDateTime;

public class Interval {
    private LocalDateTime start;
    private LocalDateTime end;
    private double peakStrain;

    public Interval(LocalDateTime start, LocalDateTime end, double peakStrain) {
        this.start = start;
        this.end = end;
        this.peakStrain = peakStrain;
    }

    public LocalDateTime getStart() { return start; }
    public LocalDateTime getEnd() { return end; }
    public double getPeakStrain() { return peakStrain; }
}