package hairmony.controller;

import hairmony.dto.AuthRequest;
import hairmony.dto.AuthResponse;
import hairmony.entities.User;
import hairmony.repository.UserRepository;
import hairmony.service.JWTUtil;
import hairmony.serviceInterfaces.AuthServiceInf;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.*;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthenticationManager authManager;
    private final UserRepository userRepository;
    private final JWTUtil jwtUtil;
    private final AuthServiceInf authService;  // inject the interface

    // Registration endpoint consuming multipart form-data
    @PostMapping(
            value = "/register",
            consumes = MediaType.MULTIPART_FORM_DATA_VALUE
    )
    public String register(
            @RequestParam("username") String username,
            @RequestParam("password") String password,
            @RequestParam("role") String role,
            @RequestParam(name="picture", required=false) MultipartFile pictureFile,

            @RequestParam(name="barbershopId", required=false, defaultValue="") String barbershopId,
            @RequestParam(name="barbershopName", required=false) String barbershopName,
            @RequestParam(name="barbershopAddress", required=false) String barbershopAddress,
            @RequestParam(name="barbershopPicture", required=false) MultipartFile barbershopPic
    ) {
        // Delegate to the service
        return authService.registerUser(
                username,
                password,
                role,
                pictureFile,
                barbershopId,
                barbershopName,
                barbershopAddress,
                barbershopPic
        );
    }

    // Example login
    @PostMapping("/login")
    public AuthResponse login(@RequestBody AuthRequest request) {
        // 1) Use Spring Security to authenticate
        Authentication auth = authManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        request.getUsername(),
                        request.getPassword()
                )
        );

        // 2) If we get here, authentication is successful
        User user = userRepository.findByUsername(request.getUsername())
                .orElseThrow(() -> new RuntimeException("User not found"));
        String token = jwtUtil.generateToken(user.getUsername(), user.getRole());

        return new AuthResponse(token, user.getRole(), user.getId());
    }
}
