package com.busmanagement.BusManagementSystem.controller;

import com.busmanagement.BusManagementSystem.model.Passenger;
import com.busmanagement.BusManagementSystem.service.PassengerService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/passengers")
@CrossOrigin(origins = "*")
public class PassengerController {

    @Autowired
    private PassengerService passengerService;

    @GetMapping
    public List<Passenger> getAllPassengers() {
        return passengerService.getAllPassengers();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Passenger> getPassengerById(@PathVariable Long id) {
        try {
            Passenger passenger = passengerService.getPassengerById(id);
            return ResponseEntity.ok(passenger);
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping("/email/{email}")
    public ResponseEntity<Passenger> getPassengerByEmail(@PathVariable String email) {
        try {
            Passenger passenger = passengerService.getPassengerByEmail(email);
            return ResponseEntity.ok(passenger);
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }

    @PostMapping
    public ResponseEntity<?> createPassenger(@RequestBody Passenger passenger) {
        try {
            Passenger createdPassenger = passengerService.createPassenger(passenger);
            return ResponseEntity.ok(createdPassenger);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updatePassenger(@PathVariable Long id, @RequestBody Passenger passengerDetails) {
        try {
            Passenger updatedPassenger = passengerService.updatePassenger(id, passengerDetails);
            return ResponseEntity.ok(updatedPassenger);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deletePassenger(@PathVariable Long id) {
        try {
            passengerService.deletePassenger(id);
            return ResponseEntity.ok().body(Map.of("message", "Passenger deleted successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/check-email/{email}")
    public ResponseEntity<?> checkEmailExists(@PathVariable String email) {
        boolean exists = passengerService.passengerExists(email);
        return ResponseEntity.ok(Map.of("exists", exists));
    }
}