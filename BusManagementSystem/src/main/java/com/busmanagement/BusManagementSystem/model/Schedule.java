package com.busmanagement.BusManagementSystem.model;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Entity
@Table(name = "schedules")
@Data
public class Schedule {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "bus_id", nullable = false)
    private Bus bus;

    @ManyToOne
    @JoinColumn(name = "route_id", nullable = false)
    private Route route;

    @ManyToOne
    @JoinColumn(name = "driver_id")
    private Driver driver;

    @Column(nullable = false)
    private LocalDateTime departureTime;

    @Column(nullable = false)
    private LocalDateTime arrivalTime;

    @Column(nullable = false)
    private Double fare;

    private Integer availableSeats;

    private String status = "SCHEDULED"; // SCHEDULED, DEPARTED, ARRIVED, CANCELLED

    @PrePersist
    @PreUpdate
    public void calculateFare() {
        if (this.route != null && this.bus != null) {
            this.fare = this.route.getDistance() * this.bus.getFarePerKm();
        }
        if (this.availableSeats == null && this.bus != null) {
            this.availableSeats = this.bus.getTotalSeats();
        }
    }
}