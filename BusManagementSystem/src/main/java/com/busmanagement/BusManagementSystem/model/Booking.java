package com.busmanagement.BusManagementSystem.model;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Entity
@Table(name = "bookings")
@Data
public class Booking {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String bookingNumber;

    @ManyToOne
    @JoinColumn(name = "passenger_id", nullable = false)
    private Passenger passenger;

    @ManyToOne
    @JoinColumn(name = "schedule_id", nullable = false)
    private Schedule schedule;

    @Column(nullable = false)
    private Integer numberOfSeats;

    @Column(nullable = false)
    private Double totalAmount;

    @Column(nullable = false)
    private String paymentStatus;

    @Column(nullable = false)
    private String bookingStatus; 

    @Column(nullable = false)
    private LocalDateTime bookingDate;

    private String seatNumbers; // Comma-separated seat numbers

    @PrePersist
    public void setDefaultValues() {
        if (this.bookingNumber == null) {
            this.bookingNumber = "BMS" + System.currentTimeMillis();
        }
        if (this.bookingDate == null) {
            this.bookingDate = LocalDateTime.now();
        }
        if (this.paymentStatus == null) {
            this.paymentStatus = "PENDING";
        }
        if (this.bookingStatus == null) {
            this.bookingStatus = "CONFIRMED";
        }
    }
}