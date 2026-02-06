package com.busmanagement.BusManagementSystem.service;

import com.busmanagement.BusManagementSystem.model.Booking;
import com.busmanagement.BusManagementSystem.model.Passenger;
import com.busmanagement.BusManagementSystem.model.Schedule;
import com.busmanagement.BusManagementSystem.repository.BookingRepository;
import com.busmanagement.BusManagementSystem.repository.PassengerRepository;
import com.busmanagement.BusManagementSystem.repository.ScheduleRepository;
import com.busmanagement.BusManagementSystem.exception.ResourceNotFoundException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;
import java.util.List;

@Service
@Transactional
public class BookingService {

    @Autowired
    private BookingRepository bookingRepository;

    @Autowired
    private PassengerRepository passengerRepository;

    @Autowired
    private ScheduleRepository scheduleRepository;

    @Autowired
    private BusService busService;

    @Autowired
    private ScheduleService scheduleService;

    public List<Booking> getAllBookings() {
        return bookingRepository.findAll();
    }

    public Booking getBookingById(Long id) {
        return bookingRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Booking not found with id: " + id));
    }

    public Booking getBookingByNumber(String bookingNumber) {
        return bookingRepository.findByBookingNumber(bookingNumber)
                .orElseThrow(() -> new ResourceNotFoundException("Booking not found with number: " + bookingNumber));
    }

    public Booking createBooking(Booking booking) {
        // Validate passenger
        Passenger passenger = passengerRepository.findById(booking.getPassenger().getId())
                .orElseThrow(() -> new ResourceNotFoundException("Passenger not found with id: " + booking.getPassenger().getId()));
        
        // Validate schedule
        Schedule schedule = scheduleRepository.findById(booking.getSchedule().getId())
                .orElseThrow(() -> new ResourceNotFoundException("Schedule not found with id: " + booking.getSchedule().getId()));
        
        // Check available seats
        if (schedule.getAvailableSeats() < booking.getNumberOfSeats()) {
            throw new RuntimeException("Not enough seats available. Available: " + schedule.getAvailableSeats() + ", Requested: " + booking.getNumberOfSeats());
        }
        
        // Calculate total amount
        double totalAmount = schedule.getFare() * booking.getNumberOfSeats();
        
        booking.setPassenger(passenger);
        booking.setSchedule(schedule);
        booking.setTotalAmount(totalAmount);
        
        // Save booking first
        Booking savedBooking = bookingRepository.save(booking);
        
        // Update available seats in schedule and bus
        scheduleService.updateAvailableSeats(schedule.getId(), booking.getNumberOfSeats());
        busService.updateBusSeats(schedule.getBus().getId(), booking.getNumberOfSeats());
        
        return savedBooking;
    }

    public Booking updateBooking(Long id, Booking bookingDetails) {
        Booking booking = getBookingById(id);
        
        booking.setNumberOfSeats(bookingDetails.getNumberOfSeats());
        booking.setSeatNumbers(bookingDetails.getSeatNumbers());
        booking.setPaymentStatus(bookingDetails.getPaymentStatus());
        booking.setBookingStatus(bookingDetails.getBookingStatus());
        
        // Recalculate total amount if seats changed
        if (!booking.getNumberOfSeats().equals(bookingDetails.getNumberOfSeats())) {
            double totalAmount = booking.getSchedule().getFare() * bookingDetails.getNumberOfSeats();
            booking.setTotalAmount(totalAmount);
        }
        
        return bookingRepository.save(booking);
    }

    public void deleteBooking(Long id) {
        Booking booking = getBookingById(id);
        bookingRepository.delete(booking);
    }

    public List<Booking> getBookingsByPassenger(Long passengerId) {
        return bookingRepository.findByPassengerId(passengerId);
    }

    public List<Booking> getBookingsBySchedule(Long scheduleId) {
        return bookingRepository.findByScheduleId(scheduleId);
    }

    public List<Booking> getBookingsByStatus(String bookingStatus) {
        return bookingRepository.findByBookingStatus(bookingStatus);
    }

    public List<Booking> getBookingsByPaymentStatus(String paymentStatus) {
        return bookingRepository.findByPaymentStatus(paymentStatus);
    }

    public Booking cancelBooking(Long id) {
        Booking booking = getBookingById(id);
        
        if ("CANCELLED".equals(booking.getBookingStatus())) {
            throw new RuntimeException("Booking is already cancelled");
        }
        
        booking.setBookingStatus("CANCELLED");
        
        // Restore available seats
        Schedule schedule = booking.getSchedule();
        scheduleService.updateAvailableSeats(schedule.getId(), -booking.getNumberOfSeats());
        busService.updateBusSeats(schedule.getBus().getId(), -booking.getNumberOfSeats());
        
        return bookingRepository.save(booking);
    }

    public Booking updatePaymentStatus(Long id, String paymentStatus) {
        Booking booking = getBookingById(id);
        booking.setPaymentStatus(paymentStatus);
        return bookingRepository.save(booking);
    }

    public Integer getConfirmedBookingsCountBySchedule(Long scheduleId) {
        return bookingRepository.countConfirmedBookingsBySchedule(scheduleId);
    }

    public List<Booking> getBookingsBetweenDates(LocalDateTime start, LocalDateTime end) {
        return bookingRepository.findBookingsBetweenDates(start, end);
    }
}