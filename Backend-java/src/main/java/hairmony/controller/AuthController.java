package hairmony.controller;

import hairmony.dto.*;
import hairmony.entities.*;
import hairmony.repository.UserRepository;
import hairmony.service.JWTUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.*;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/auth")
public class AuthController {

    @Autowired
    private AuthenticationManager authManager;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JWTUtil jwtUtil;

    @PostMapping("/register")
    public String register(@RequestBody RegisterRequest request) {
        // Check if username already exists
        if (userRepository.findByUsername(request.getUsername()).isPresent()) {
            return "Username already taken!";
        }

        // Hash the password
        String encodedPass = passwordEncoder.encode(request.getPassword());

        // Create user based on role
        User newUser;
        switch (request.getRole().toUpperCase()) {
            case "CLIENT" -> {
                newUser = new Client(
                        request.getUsername(),
                        encodedPass,
                        request.getPicture(),
                        "CLIENT",
                        request.getFaceShape()
                );
            }
            case "BARBER" -> {
                newUser = new Barber(
                        request.getUsername(),
                        encodedPass,
                        request.getPicture(),
                        "BARBER",
                        request.getSpecialty(),
                        request.getRating() != null ? request.getRating() : 0.0
                );
            }
            case "ADMIN" -> {
                newUser = new Admin(
                        request.getUsername(),
                        encodedPass,
                        request.getPicture(),
                        "ADMIN"
                );
            }
            default -> {
                return "Invalid role. Must be CLIENT, BARBER, or ADMIN.";
            }
        }

        userRepository.save(newUser);
        return "Registration successful for " + request.getUsername();
    }

    @PostMapping("/login")
    public AuthResponse login(@RequestBody AuthRequest request) {
        // Perform authentication
        Authentication auth = authManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        request.getUsername(),
                        request.getPassword()
                )
        );

        // If we get here, authentication was successful
        User user = userRepository.findByUsername(request.getUsername()).orElseThrow();
        String token = jwtUtil.generateToken(user.getUsername(), user.getRole());

        return new AuthResponse(token,user.getRole(),user.getId());
    }
}
