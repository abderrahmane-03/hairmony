// HaircutController.java
package hairmony.controller;

import hairmony.entities.Haircuts;
import hairmony.serviceInterfaces.HaircutServiceInf;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/haircuts")
public class HaircutController {

    private final HaircutServiceInf haircutService;

    public HaircutController(HaircutServiceInf haircutService) {
        this.haircutService = haircutService;
    }

    @GetMapping
    public ResponseEntity<List<Haircuts>> getAllHaircuts() {
        return ResponseEntity.ok(haircutService.getAllHaircuts());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Haircuts> getHaircutById(@PathVariable Long id) {
        return ResponseEntity.ok(haircutService.getHaircutById(id));
    }

    @GetMapping("/face-shape/{faceShape}")
    public ResponseEntity<List<Haircuts>> getByFaceShape(@PathVariable String faceShape) {
        return ResponseEntity.ok(haircutService.getHaircutsByFaceShape(faceShape));
    }

    @GetMapping("/search")
    public ResponseEntity<List<Haircuts>> searchHaircuts(@RequestParam String query) {
        return ResponseEntity.ok(haircutService.searchHaircuts(query));
    }

    @PostMapping
    public ResponseEntity<Haircuts> createHaircut(@RequestBody Haircuts haircut) {
        return ResponseEntity.ok(haircutService.createHaircut(haircut));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Haircuts> updateHaircut(@PathVariable Long id, @RequestBody Haircuts haircutDetails) {
        return ResponseEntity.ok(haircutService.updateHaircut(id, haircutDetails));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteHaircut(@PathVariable Long id) {
        haircutService.deleteHaircut(id);
        return ResponseEntity.noContent().build();
    }
}