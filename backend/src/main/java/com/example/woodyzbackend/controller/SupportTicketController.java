package com.example.woodyzbackend.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.woodyzbackend.dto.SupportTicketCreateRequestDTO;
import com.example.woodyzbackend.entity.SupportTicket;
import com.example.woodyzbackend.entity.User;
import com.example.woodyzbackend.service.SupportTicketService;
import com.example.woodyzbackend.service.UserService;

/**
 * REST controller for managing customer support tickets. Provides endpoints for
 * users to submit tickets and for admins to manage them.
 *
 * Connections: - Integrates with `SupportTicketService` for ticket lifecycle
 * management. - Uses `UserService` to identify the current user or assign
 * tickets to guests. - Exposed via `/api/support/**`.
 */
@RestController
@RequestMapping("/api/support")
public class SupportTicketController {

    @Autowired
    private SupportTicketService supportTicketService;

    @Autowired
    private UserService userService;

    /**
     * Retrieves all support tickets in the system. Typically restricted to
     * ADMIN via SecurityConfig.
     *
     * @return An iterable of all `SupportTicket` entities.
     */
    @GetMapping
    public Iterable<SupportTicket> getAllTickets() {
        return supportTicketService.getAllTickets();
    }

    /**
     * Retrieves all tickets submitted by the currently authenticated user.
     *
     * @return A `ResponseEntity` containing the user's tickets, or 401
     * Unauthorized.
     */
    @GetMapping("/user")
    public ResponseEntity<Iterable<SupportTicket>> getTicketsByUser() {
        User currentUser = userService.getCurrentUser();
        if (currentUser == null) {
            return ResponseEntity.status(401).build();
        }
        return ResponseEntity.ok(supportTicketService.getTicketsByUserId(currentUser.getId()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<SupportTicket> getTicketById(@PathVariable Long id) {
        User currentUser = userService.getCurrentUser();
        if (currentUser == null) {
            return ResponseEntity.status(401).build();
        }
        SupportTicket ticket = supportTicketService.getTicketById(id);
        if (ticket == null) {
            return ResponseEntity.notFound().build();
        }
        if (!ticket.getUserId().equals(currentUser.getId())) {
            return ResponseEntity.status(403).build();
        }
        return ResponseEntity.ok(ticket);
    }

    /**
     * Creates a new support ticket. Automatically associates the ticket with
     * the authenticated user, or labels it as "Guest Explorer".
     *
     * @param ticket The ticket details.
     * @return A `ResponseEntity` containing the created `SupportTicket`.
     */
    @PostMapping({"", "/"})
    public ResponseEntity<SupportTicket> createTicket(@RequestBody SupportTicketCreateRequestDTO request) {
        SupportTicket ticket = new SupportTicket();
        ticket.setSubject(request.getSubject());
        ticket.setMessage(request.getMessage());
        User currentUser = userService.getCurrentUser();
        if (currentUser != null) {
            ticket.setUserId(currentUser.getId());
            ticket.setUsername(currentUser.getUsername());
        } else {
            ticket.setUserId(null);
            ticket.setUsername("Guest Explorer");
        }
        return ResponseEntity.ok(supportTicketService.saveTicket(ticket));
    }

    /**
     * Updates the status of an existing support ticket. Typically restricted to
     * ADMIN via SecurityConfig.
     *
     * @param id The unique identifier of the ticket.
     * @param status The new status string.
     * @return A `ResponseEntity` containing the updated `SupportTicket`.
     */
    @PutMapping("/{id}/status")
    public ResponseEntity<SupportTicket> updateStatus(@PathVariable Long id, @RequestBody String status) {
        SupportTicket ticket = supportTicketService.getTicketById(id);
        if (ticket == null) {
            return ResponseEntity.notFound().build();
        }
        ticket.setStatus(status.replace("\"", "")); // Clean quotes if sent as string
        return ResponseEntity.ok(supportTicketService.saveTicket(ticket));
    }

    /**
     * Adds an admin reply/message to an existing support ticket. Restricted to
     * ADMIN via SecurityConfig.
     *
     * @param id The unique identifier of the ticket.
     * @param body The message body map (expects a "message" key).
     * @return A {@code ResponseEntity} containing the updated ticket.
     */
    @PostMapping("/{id}/message")
    public ResponseEntity<SupportTicket> addMessage(@PathVariable Long id, @RequestBody(required = false) java.util.Map<String, String> body) {
        SupportTicket ticket = supportTicketService.getTicketById(id);
        if (ticket == null || body == null) {
            return ResponseEntity.notFound().build();
        }
        String msg = body.getOrDefault("message", "");
        if (!msg.isBlank()) {
            ticket.setMessage(ticket.getMessage() == null ? msg : ticket.getMessage() + "\n---\n" + msg);
        }
        return ResponseEntity.ok(supportTicketService.saveTicket(ticket));
    }
}
