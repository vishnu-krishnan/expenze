package com.expenze.controller;

import com.expenze.dto.SystemSettingDto;
import com.expenze.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api")
public class SystemSettingController {

    @Autowired
    private UserService userService; // Using UserService as access point for settings for now

    @GetMapping("/settings/{key}")
    public ResponseEntity<?> getSetting(@PathVariable String key) {
        SystemSettingDto setting = userService.getSetting(key);
        if (setting == null)
            return ResponseEntity.notFound().build();
        // Public check logic could be here or in service. Service returns DTO.
        // Legacy: if public=0 and not admin, hide?
        // Legacy get: /api/settings/:key -> returns if found. Logic in server.js says
        // "Only return public settings for non-admin users"??
        // Wait, legacy code: "Only return public settings for non-admin users" is a
        // comment, but implementation:
        // app.get('/api/settings/:key', async (req, res) => { ... res.json(setting); })
        // -> It sends it regardless of public flag, unless I misread.
        // Actually, looking at legacy code provided: "res.json(setting);" is lines 502.
        // It does not check login or public flag effectively there?
        // The comment says "Only return public settings for non-admin users", but the
        // code simply returns `setting`.
        // However, this endpoint is used for things like `otp_timeout` which is
        // public=1.
        return ResponseEntity.ok(setting);
    }

    @GetMapping("/admin/settings")
    public ResponseEntity<?> getAllSettings() {
        return ResponseEntity.ok(userService.getAllSettings());
    }

    @PutMapping("/admin/settings/{key}")
    public ResponseEntity<?> updateSetting(@PathVariable String key, @RequestBody SystemSettingDto dto) {
        userService.updateSetting(key, dto);
        return ResponseEntity.ok(Map.of("success", true));
    }
}
