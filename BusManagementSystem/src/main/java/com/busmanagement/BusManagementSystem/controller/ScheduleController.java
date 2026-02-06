package com.busmanagement.BusManagementSystem.controller;

import com.busmanagement.BusManagementSystem.model.Schedule;
import com.busmanagement.BusManagementSystem.service.ScheduleService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/schedules")
public class ScheduleController {

    @Autowired
    private ScheduleService scheduleService;

    @GetMapping
    public List<Schedule> getAllSchedules() {
        return scheduleService.getAllSchedules();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Schedule> getScheduleById(@PathVariable Long id) {
        try {
            Schedule schedule = scheduleService.getScheduleById(id);
            return ResponseEntity.ok(schedule);
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }

    @PostMapping
    public ResponseEntity<?> createSchedule(@RequestBody Schedule schedule) {
        try {
            Schedule createdSchedule = scheduleService.createSchedule(schedule);
            return ResponseEntity.ok(createdSchedule);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateSchedule(@PathVariable Long id, @RequestBody Schedule scheduleDetails) {
        try {
            Schedule updatedSchedule = scheduleService.updateSchedule(id, scheduleDetails);
            return ResponseEntity.ok(updatedSchedule);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteSchedule(@PathVariable Long id) {
        try {
            scheduleService.deleteSchedule(id);
            return ResponseEntity.ok().body(Map.of("message", "Schedule deleted successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/bus/{busId}")
    public List<Schedule> getSchedulesByBus(@PathVariable Long busId) {
        return scheduleService.getSchedulesByBus(busId);
    }

    @GetMapping("/route/{routeId}")
    public List<Schedule> getSchedulesByRoute(@PathVariable Long routeId) {
        return scheduleService.getSchedulesByRoute(routeId);
    }

    @GetMapping("/driver/{driverId}")
    public List<Schedule> getSchedulesByDriver(@PathVariable Long driverId) {
        return scheduleService.getSchedulesByDriver(driverId);
    }

    @GetMapping("/status/{status}")
    public List<Schedule> getSchedulesByStatus(@PathVariable String status) {
        return scheduleService.getSchedulesByStatus(status);
    }

    @GetMapping("/available")
    public List<Schedule> getAvailableSchedules(
            @RequestParam String source,
            @RequestParam String destination,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime departureTime) {
        return scheduleService.getAvailableSchedules(source, destination, departureTime);
    }

    @GetMapping("/upcoming")
    public List<Schedule> getUpcomingSchedules() {
        return scheduleService.getUpcomingSchedules();
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<?> updateScheduleStatus(@PathVariable Long id, @RequestBody Map<String, String> request) {
        try {
            String status = request.get("status");
            Schedule updatedSchedule = scheduleService.updateScheduleStatus(id, status);
            return ResponseEntity.ok(updatedSchedule);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}