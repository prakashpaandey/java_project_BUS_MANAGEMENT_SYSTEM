package com.busmanagement.BusManagementSystem.service;

import com.busmanagement.BusManagementSystem.model.Bus;
import com.busmanagement.BusManagementSystem.repository.BusRepository;
import com.busmanagement.BusManagementSystem.exception.ResourceNotFoundException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.Optional;

@Service
public class BusService {

    @Autowired
    private BusRepository busRepository;

    public List<Bus> getAllBuses() {
        return busRepository.findAll();
    }

    public Bus getBusById(Long id) {
        return busRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Bus not found with id: " + id));
    }

    public Bus getBusByBusNumber(String busNumber) {
        return busRepository.findByBusNumber(busNumber)
                .orElseThrow(() -> new ResourceNotFoundException("Bus not found with number: " + busNumber));
    }

    public Bus createBus(Bus bus) {
        if (busRepository.existsByBusNumber(bus.getBusNumber())) {
            throw new RuntimeException("Bus with number " + bus.getBusNumber() + " already exists");
        }
        
        // Set available seats equal to total seats initially
        bus.setAvailableSeats(bus.getTotalSeats());
        return busRepository.save(bus);
    }

    public Bus updateBus(Long id, Bus busDetails) {
        Bus bus = getBusById(id);
        
        // Check if bus number is being changed and if it already exists
        if (!bus.getBusNumber().equals(busDetails.getBusNumber()) && 
            busRepository.existsByBusNumber(busDetails.getBusNumber())) {
            throw new RuntimeException("Bus with number " + busDetails.getBusNumber() + " already exists");
        }
        
        bus.setBusNumber(busDetails.getBusNumber());
        bus.setBusType(busDetails.getBusType());
        bus.setTotalSeats(busDetails.getTotalSeats());
        bus.setFarePerKm(busDetails.getFarePerKm());
        bus.setIsAvailable(busDetails.getIsAvailable());
        bus.setCurrentLocation(busDetails.getCurrentLocation());
        
        // Update available seats if total seats changed
        if (!bus.getTotalSeats().equals(busDetails.getTotalSeats())) {
            int seatDifference = busDetails.getTotalSeats() - bus.getTotalSeats();
            bus.setAvailableSeats(Math.max(0, bus.getAvailableSeats() + seatDifference));
        }
        
        return busRepository.save(bus);
    }

    public void deleteBus(Long id) {
        Bus bus = getBusById(id);
        busRepository.delete(bus);
    }

    public List<Bus> getAvailableBuses() {
        return busRepository.findByIsAvailableTrue();
    }

    public List<Bus> getBusesByType(String busType) {
        return busRepository.findByBusType(busType);
    }

    public List<Bus> getBusesByLocation(String location) {
        return busRepository.findByCurrentLocation(location);
    }

    public Bus updateBusAvailability(Long id, Boolean isAvailable) {
        Bus bus = getBusById(id);
        bus.setIsAvailable(isAvailable);
        return busRepository.save(bus);
    }

    public Bus updateBusSeats(Long id, Integer seatsBooked) {
        Bus bus = getBusById(id);
        int newAvailableSeats = bus.getAvailableSeats() - seatsBooked;
        if (newAvailableSeats < 0) {
            throw new RuntimeException("Not enough seats available");
        }
        bus.setAvailableSeats(newAvailableSeats);
        return busRepository.save(bus);
    }
}