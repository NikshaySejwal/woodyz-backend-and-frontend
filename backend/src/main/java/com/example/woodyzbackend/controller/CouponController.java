package com.example.woodyzbackend.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.woodyzbackend.entity.Coupon;
import com.example.woodyzbackend.repository.CouponRepository;

@RestController
@RequestMapping("/api/coupons")
public class CouponController {

    private final CouponRepository couponRepository;

    public CouponController(CouponRepository couponRepository) {
        this.couponRepository = couponRepository;
    }

    @GetMapping
    public Iterable<Coupon> getCoupons() {
        return couponRepository.findAll();
    }

    @PostMapping({"", "/"})
    public ResponseEntity<Coupon> createCoupon(@RequestBody Coupon coupon) {
        if (coupon.getCode() == null || coupon.getCode().trim().isEmpty()
                || coupon.getDiscountPercent() <= 0 || coupon.getDiscountPercent() > 100
                || couponRepository.existsByCodeIgnoreCase(coupon.getCode())) {
            return ResponseEntity.badRequest().build();
        }
        coupon.setId(null);
        return ResponseEntity.status(HttpStatus.CREATED).body(couponRepository.save(coupon));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Coupon> updateCoupon(@PathVariable Long id, @RequestBody Coupon input) {
        Coupon coupon = couponRepository.findById(java.util.Objects.requireNonNull(id)).orElse(null);
        if (coupon == null) {
            return ResponseEntity.notFound().build();
        }
        coupon.setCode(input.getCode());
        coupon.setDiscountPercent(input.getDiscountPercent());
        coupon.setActive(input.isActive());
        coupon.setExpiresAt(input.getExpiresAt());
        return ResponseEntity.ok(couponRepository.save(coupon));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteCoupon(@PathVariable Long id) {
        if (!couponRepository.existsById(java.util.Objects.requireNonNull(id))) {
            return ResponseEntity.notFound().build();
        }
        couponRepository.deleteById(java.util.Objects.requireNonNull(id));
        return ResponseEntity.noContent().build();
    }
}
