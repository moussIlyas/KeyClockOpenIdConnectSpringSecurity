package com.sid.tp_keyclock.controller;

import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
public class NotesController {

    @GetMapping("/public/hello")
    public String hello() {
        return "Hello World!";
    }

    @GetMapping("/api/notes")
    public List<Map<String,Object>> getNotes(Authentication authentication) {

        return List.of(
                Map.of("module","Big data" ,"note", 16,"etudiant",authentication.getName()),
                Map.of("module","security" ,"note", 14, "etudiant",authentication.getName())
        );

    }
}
