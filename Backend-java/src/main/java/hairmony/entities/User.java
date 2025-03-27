package hairmony.entities;

import jakarta.persistence.*;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "users")
@Inheritance(strategy = InheritanceType.SINGLE_TABLE)
@DiscriminatorColumn(name = "user_type")
public abstract class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true)
    private String username;

    private String password;

    private String role;

    private String picture;

    @Column(nullable = false, columnDefinition = "integer default 1")
    private int freeTrialsRemaining;

    @Column(nullable = false, columnDefinition = "integer default 1")
    private int LiveTrialsRemaining;

    @Column(nullable = false, columnDefinition = "boolean default false")
    private boolean unlimitedAccess;

    @Column(nullable = false, columnDefinition = "boolean default false")
    private boolean VIPSubscriber;

    @Column(nullable = false, columnDefinition = "boolean default false")
    private boolean normalSubscriber;



    public User(String username, String password, String role ,String picture) {
        this.username = username;
        this.password = password;
        this.role = role;
        this.picture= picture;
        this.freeTrialsRemaining = 1;
        this.LiveTrialsRemaining = 1;
        this.unlimitedAccess = false;
        this.VIPSubscriber = false;
        this.normalSubscriber = false;


    }
}
