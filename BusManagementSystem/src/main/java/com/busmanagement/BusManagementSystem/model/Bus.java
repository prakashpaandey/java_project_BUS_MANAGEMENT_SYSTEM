package com.busmanagement.BusManagementSystem.model;

import jakarta.persistence.*;
import lombok.Data;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "buses")
@Data
public class Bus {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String busNumber;

    @Column(nullable = false)
    private String busType; // AC, Non-AC, Sleeper

    @Column(nullable = false)
    private Integer totalSeats;

    private Integer availableSeats;

    @Column(nullable = false)
    private Double farePerKm;

    private Boolean isAvailable = true;

    @Column(nullable = false)
    private String currentLocation;

    @OneToMany(mappedBy = "bus", cascade = CascadeType.ALL)
    private List<Schedule> schedules = new ArrayList<>();

    @PrePersist
    @PreUpdate
    public void setAvailableSeats() {
        if (this.availableSeats == null) {
            this.availableSeats = this.totalSeats;
        }
    }
}