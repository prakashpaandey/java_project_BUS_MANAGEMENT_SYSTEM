package com.busmanagement.BusManagementSystem.controller;

import com.busmanagement.BusManagementSystem.model.Bus;
import com.busmanagement.BusManagementSystem.service.BusService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/buses")
public class BusController {

    @Autowired
    private BusService busService;

    @GetMapping
    public List<Bus> getAllBuses() {
        return busService.getAllBuses();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Bus> getBusById(@PathVariable Long id) {
        try {
            Bus bus = busService.getBusById(id);
            return ResponseEntity.ok(bus);
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping("/number/{busNumber}")
    public ResponseEntity<Bus> getBusByNumber(@PathVariable String busNumber) {
        try {
            Bus bus = busService.getBusByBusNumber(busNumber);
            return ResponseEntity.ok(bus);
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }

    @PostMapping
    public ResponseEntity<?> createBus(@RequestBody Bus bus) {
        try {
            Bus createdBus = busService.createBus(bus);
            return ResponseEntity.ok(createdBus);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateBus(@PathVariable Long id, @RequestBody Bus busDetails) {
        try {
            Bus updatedBus = busService.updateBus(id, busDetails);
            return ResponseEntity.ok(updatedBus);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteBus(@PathVariable Long id) {
        try {
            busService.deleteBus(id);
            return ResponseEntity.ok().body(Map.of("message", "Bus deleted successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/available")
    public List<Bus> getAvailableBuses() {
        return busService.getAvailableBuses();
    }

    @GetMapping("/type/{busType}")
    public List<Bus> getBusesByType(@PathVariable String busType) {
        return busService.getBusesByType(busType);
    }

    @GetMapping("/location/{location}")
    public List<Bus> getBusesByLocation(@PathVariable String location) {
        return busService.getBusesByLocation(location);
    }

    @PatchMapping("/{id}/availability")
    public ResponseEntity<?> updateBusAvailability(@PathVariable Long id, @RequestBody Map<String, Boolean> request) {
        try {
            Boolean isAvailable = request.get("isAvailable");
            Bus updatedBus = busService.updateBusAvailability(id, isAvailable);
            return ResponseEntity.ok(updatedBus);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}