package com.busmanagement.BusManagementSystem.service;

import com.busmanagement.BusManagementSystem.model.Schedule;
import com.busmanagement.BusManagementSystem.model.Bus;
import com.busmanagement.BusManagementSystem.model.Route;
import com.busmanagement.BusManagementSystem.model.Driver;
import com.busmanagement.BusManagementSystem.repository.ScheduleRepository;
import com.busmanagement.BusManagementSystem.repository.BusRepository;
import com.busmanagement.BusManagementSystem.repository.RouteRepository;
import com.busmanagement.BusManagementSystem.repository.DriverRepository;
import com.busmanagement.BusManagementSystem.exception.ResourceNotFoundException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class ScheduleService {

    @Autowired
    private ScheduleRepository scheduleRepository;

    @Autowired
    private BusRepository busRepository;

    @Autowired
    private RouteRepository routeRepository;

    @Autowired
    private DriverRepository driverRepository;

    public List<Schedule> getAllSchedules() {
        return scheduleRepository.findAll();
    }

    public Schedule getScheduleById(Long id) {
        return scheduleRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Schedule not found with id: " + id));
    }

    public Schedule createSchedule(Schedule schedule) {
        // Validate bus
        Bus bus = busRepository.findById(schedule.getBus().getId())
                .orElseThrow(() -> new ResourceNotFoundException("Bus not found with id: " + schedule.getBus().getId()));
        
        // Validate route
        Route route = routeRepository.findById(schedule.getRoute().getId())
                .orElseThrow(() -> new ResourceNotFoundException("Route not found with id: " + schedule.getRoute().getId()));
        
        // Validate driver if provided
        if (schedule.getDriver() != null && schedule.getDriver().getId() != null) {
            Driver driver = driverRepository.findById(schedule.getDriver().getId())
                    .orElseThrow(() -> new ResourceNotFoundException("Driver not found with id: " + schedule.getDriver().getId()));
            schedule.setDriver(driver);
        }
        
        schedule.setBus(bus);
        schedule.setRoute(route);
        
        // Set available seats from bus
        schedule.setAvailableSeats(bus.getTotalSeats());
        
        return scheduleRepository.save(schedule);
    }

    public Schedule updateSchedule(Long id, Schedule scheduleDetails) {
        Schedule schedule = getScheduleById(id);
        
        // Update bus if changed
        if (!schedule.getBus().getId().equals(scheduleDetails.getBus().getId())) {
            Bus bus = busRepository.findById(scheduleDetails.getBus().getId())
                    .orElseThrow(() -> new ResourceNotFoundException("Bus not found with id: " + scheduleDetails.getBus().getId()));
            schedule.setBus(bus);
        }
        
        // Update route if changed
        if (!schedule.getRoute().getId().equals(scheduleDetails.getRoute().getId())) {
            Route route = routeRepository.findById(scheduleDetails.getRoute().getId())
                    .orElseThrow(() -> new ResourceNotFoundException("Route not found with id: " + scheduleDetails.getRoute().getId()));
            schedule.setRoute(route);
        }
        
        // Update driver if changed
        if (scheduleDetails.getDriver() != null && scheduleDetails.getDriver().getId() != null) {
            Driver driver = driverRepository.findById(scheduleDetails.getDriver().getId())
                    .orElseThrow(() -> new ResourceNotFoundException("Driver not found with id: " + scheduleDetails.getDriver().getId()));
            schedule.setDriver(driver);
        } else {
            schedule.setDriver(null);
        }
        
        schedule.setDepartureTime(scheduleDetails.getDepartureTime());
        schedule.setArrivalTime(scheduleDetails.getArrivalTime());
        schedule.setStatus(scheduleDetails.getStatus());
        
        return scheduleRepository.save(schedule);
    }

    public void deleteSchedule(Long id) {
        Schedule schedule = getScheduleById(id);
        scheduleRepository.delete(schedule);
    }

    public List<Schedule> getSchedulesByBus(Long busId) {
        return scheduleRepository.findByBusId(busId);
    }

    public List<Schedule> getSchedulesByRoute(Long routeId) {
        return scheduleRepository.findByRouteId(routeId);
    }

    public List<Schedule> getSchedulesByDriver(Long driverId) {
        return scheduleRepository.findByDriverId(driverId);
    }

    public List<Schedule> getSchedulesByStatus(String status) {
        return scheduleRepository.findByStatus(status);
    }

    public List<Schedule> getAvailableSchedules(String source, String destination, LocalDateTime departureTime) {
        return scheduleRepository.findAvailableSchedules(source, destination, departureTime);
    }

    public List<Schedule> getUpcomingSchedules() {
        return scheduleRepository.findByDepartureTimeAfterAndAvailableSeatsGreaterThan(
                LocalDateTime.now(), 0);
    }

    public Schedule updateScheduleStatus(Long id, String status) {
        Schedule schedule = getScheduleById(id);
        schedule.setStatus(status);
        return scheduleRepository.save(schedule);
    }

    public Schedule updateAvailableSeats(Long id, Integer seatsBooked) {
        Schedule schedule = getScheduleById(id);
        int newAvailableSeats = schedule.getAvailableSeats() - seatsBooked;
        if (newAvailableSeats < 0) {
            throw new RuntimeException("Not enough seats available in schedule");
        }
        schedule.setAvailableSeats(newAvailableSeats);
        return scheduleRepository.save(schedule);
    }
}