// Haircuts.java
package hairmony.entities;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import lombok.Data;

@Entity
@Data
public class Haircuts {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;
    private String description;
    private double price;
    private String faceShape;  // To match with face shape recommendations
    private String imageUrl;

    // Constructors
    public Haircuts() {}

    public Haircuts(String name, String description, double price, String faceShape, String imageUrl) {
        this.name = name;
        this.description = description;
        this.price = price;
        this.faceShape = faceShape;
        this.imageUrl = imageUrl;
    }

    // Getters and Setters
    // ... (Add all getters and setters for the fields above)
}