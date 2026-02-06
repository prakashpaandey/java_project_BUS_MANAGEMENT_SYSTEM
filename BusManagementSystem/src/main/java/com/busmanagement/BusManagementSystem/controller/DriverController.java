package com.busmanagement.BusManagementSystem.controller;

import com.busmanagement.BusManagementSystem.model.Driver;
import com.busmanagement.BusManagementSystem.service.DriverService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/drivers")
@CrossOrigin(origins = "*")
public class DriverController {

    @Autowired
    private DriverService driverService;

    @GetMapping
    public List<Driver> getAllDrivers() {
        return driverService.getAllDrivers();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Driver> getDriverById(@PathVariable Long id) {
        try {
            Driver driver = driverService.getDriverById(id);
            return ResponseEntity.ok(driver);
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping("/license/{licenseNumber}")
    public ResponseEntity<Driver> getDriverByLicense(@PathVariable String licenseNumber) {
        try {
            Driver driver = driverService.getDriverByLicense(licenseNumber);
            return ResponseEntity.ok(driver);
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }

    @PostMapping
    public ResponseEntity<?> createDriver(@RequestBody Driver driver) {
        try {
            Driver createdDriver = driverService.createDriver(driver);
            return ResponseEntity.ok(createdDriver);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateDriver(@PathVariable Long id, @RequestBody Driver driverDetails) {
        try {
            Driver updatedDriver = driverService.updateDriver(id, driverDetails);
            return ResponseEntity.ok(updatedDriver);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteDriver(@PathVariable Long id) {
        try {
            driverService.deleteDriver(id);
            return ResponseEntity.ok().body(Map.of("message", "Driver deleted successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/available")
    public List<Driver> getAvailableDrivers() {
        return driverService.getAvailableDrivers();
    }

    @PostMapping("/{driverId}/assign-bus/{busId}")
    public ResponseEntity<?> assignBusToDriver(@PathVariable Long driverId, @PathVariable Long busId) {
        try {
            Driver updatedDriver = driverService.assignBusToDriver(driverId, busId);
            return ResponseEntity.ok(updatedDriver);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/{driverId}/remove-bus")
    public ResponseEntity<?> removeBusFromDriver(@PathVariable Long driverId) {
        try {
            Driver updatedDriver = driverService.removeBusFromDriver(driverId);
            return ResponseEntity.ok(updatedDriver);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PatchMapping("/{id}/availability")
    public ResponseEntity<?> updateDriverAvailability(@PathVariable Long id, @RequestBody Map<String, Boolean> request) {
        try {
            Boolean isAvailable = request.get("isAvailable");
            Driver updatedDriver = driverService.updateDriverAvailability(id, isAvailable);
            return ResponseEntity.ok(updatedDriver);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}