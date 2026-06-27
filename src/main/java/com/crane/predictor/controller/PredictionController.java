package com.crane.predictor.controller;

import com.crane.predictor.model.PredictionResponse;
import com.crane.predictor.service.PredictionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "*")   // allow frontend dev server on a different port
public class PredictionController {

    @Autowired
    private PredictionService predictionService;

    /**
     * POST /api/predict
     * Accepts a multipart CSV file and returns the prediction JSON.
     */
    @PostMapping("/predict")
    public ResponseEntity<PredictionResponse> predict(
            @RequestParam("file") MultipartFile file) {

        if (file.isEmpty()) {
            PredictionResponse err = new PredictionResponse();
            err.setSuccess(false);
            err.setErrorMessage("No file uploaded.");
            return ResponseEntity.badRequest().body(err);
        }

        String filename = file.getOriginalFilename();
        if (filename == null || !filename.toLowerCase().endsWith(".csv")) {
            PredictionResponse err = new PredictionResponse();
            err.setSuccess(false);
            err.setErrorMessage("Only CSV files are supported.");
            return ResponseEntity.badRequest().body(err);
        }

        PredictionResponse result = predictionService.analyze(file);
        return ResponseEntity.ok(result);
    }

    /**
     * GET /api/health
     * Simple health-check so the frontend knows the server is up.
     */
    @GetMapping("/health")
    public ResponseEntity<String> health() {
        return ResponseEntity.ok("{\"status\":\"UP\"}");
    }
}