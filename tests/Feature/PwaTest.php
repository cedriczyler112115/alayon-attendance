<?php

use Illuminate\Support\Facades\File;

test('pwa webmanifest file is accessible and contains required metadata', function () {
    $response = $this->get('/manifest.webmanifest');

    $response->assertStatus(200);
    $response->assertHeader('Content-Type', 'application/manifest+json');

    $content = $response->streamedContent();
    $manifest = json_decode($content, true);

    expect($manifest)->toBeArray()
        ->and($manifest['name'])->toContain('ALAYON')
        ->and($manifest['display'])->toBe('standalone')
        ->and($manifest['start_url'])->toBe('/')
        ->and($manifest['scope'])->toBe('/')
        ->and($manifest['icons'])->toBeArray()
        ->and(count($manifest['icons']))->toBeGreaterThanOrEqual(2);
});

test('pwa service worker script is accessible and provides root scope authorization header', function () {
    $response = $this->get('/sw.js');

    $response->assertStatus(200);
    $response->assertHeader('Content-Type', 'application/javascript');
    $response->assertHeader('Service-Worker-Allowed', '/');
});

test('pwa icons exist in public directory', function () {
    expect(File::exists(public_path('pwa-192x192.png')))->toBeTrue()
        ->and(File::exists(public_path('pwa-512x512.png')))->toBeTrue()
        ->and(File::exists(public_path('apple-touch-icon.png')))->toBeTrue()
        ->and(File::exists(public_path('manifest.webmanifest')))->toBeTrue();
});

test('application layout includes pwa manifest and mobile fullscreen meta tags', function () {
    $response = $this->get('/');

    $response->assertStatus(200);
    $response->assertSee('rel="manifest"', false);
    $response->assertSee('/manifest.webmanifest', false);
    $response->assertSee('name="mobile-web-app-capable"', false);
    $response->assertSee('name="apple-mobile-web-app-capable"', false);
    $response->assertSee('theme-color', false);
});
