package com.busmanagement.BusManagementSystem.repository;

import com.busmanagement.BusManagementSystem.model.Booking;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface BookingRepository extends JpaRepository<Booking, Long> {
    Optional<Booking> findByBookingNumber(String bookingNumber);
    List<Booking> findByPassengerId(Long passengerId);
    List<Booking> findByScheduleId(Long scheduleId);
    List<Booking> findByBookingStatus(String bookingStatus);
    List<Booking> findByPaymentStatus(String paymentStatus);
    
    @Query("SELECT b FROM Booking b WHERE b.bookingDate BETWEEN :start AND :end")
    List<Booking> findBookingsBetweenDates(LocalDateTime start, LocalDateTime end);
    
    @Query("SELECT COUNT(b) FROM Booking b WHERE b.schedule.id = :scheduleId AND b.bookingStatus = 'CONFIRMED'")
    Integer countConfirmedBookingsBySchedule(Long scheduleId);
}