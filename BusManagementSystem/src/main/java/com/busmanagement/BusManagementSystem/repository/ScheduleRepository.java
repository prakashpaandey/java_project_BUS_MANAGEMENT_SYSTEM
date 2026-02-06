package com.busmanagement.BusManagementSystem.repository;

import com.busmanagement.BusManagementSystem.model.Schedule;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface ScheduleRepository extends JpaRepository<Schedule, Long> {
    List<Schedule> findByBusId(Long busId);
    List<Schedule> findByRouteId(Long routeId);
    List<Schedule> findByDriverId(Long driverId);
    List<Schedule> findByStatus(String status);
    
    @Query("SELECT s FROM Schedule s WHERE s.departureTime BETWEEN :start AND :end")
    List<Schedule> findSchedulesBetweenDates(LocalDateTime start, LocalDateTime end);
    
    @Query("SELECT s FROM Schedule s WHERE s.route.source = :source AND s.route.destination = :destination AND s.departureTime >= :departureTime AND s.availableSeats > 0")
    List<Schedule> findAvailableSchedules(String source, String destination, LocalDateTime departureTime);
    
    List<Schedule> findByDepartureTimeAfterAndAvailableSeatsGreaterThan(LocalDateTime departureTime, Integer availableSeats);
}