<?php
// core/Jwt.php
// JWT HS256 thuan PHP - khong can cai firebase/php-jwt.
// Neu ban muon dung firebase/php-jwt thi van duoc, class nay chi la fallback.

class Jwt {

    private static function base64UrlEncode($data) {
        return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
    }

    private static function base64UrlDecode($data) {
        $remainder = strlen($data) % 4;
        if ($remainder) {
            $data .= str_repeat('=', 4 - $remainder);
        }
        return base64_decode(strtr($data, '-_', '+/'));
    }

    // Tao token tu mang payload
    public static function encode(array $payload) {
        $header = ['typ' => 'JWT', 'alg' => 'HS256'];

        $now = time();
        $payload['iss'] = JWT_ISSUER;
        $payload['iat'] = $now;
        $payload['exp'] = $now + JWT_EXPIRE;

        $segments = [];
        $segments[] = self::base64UrlEncode(json_encode($header, JSON_UNESCAPED_UNICODE));
        $segments[] = self::base64UrlEncode(json_encode($payload, JSON_UNESCAPED_UNICODE));

        $signingInput = implode('.', $segments);
        $signature = hash_hmac('sha256', $signingInput, JWT_SECRET, true);
        $segments[] = self::base64UrlEncode($signature);

        return implode('.', $segments);
    }

    // Giai ma + xac thuc token. Tra ve payload (array) hoac null neu sai/het han.
    public static function decode($jwt) {
        if (!$jwt) return null;
        $parts = explode('.', $jwt);
        if (count($parts) !== 3) return null;

        list($headB64, $payloadB64, $sigB64) = $parts;

        $signingInput = $headB64 . '.' . $payloadB64;
        $expectedSig  = hash_hmac('sha256', $signingInput, JWT_SECRET, true);
        $providedSig  = self::base64UrlDecode($sigB64);

        // So sanh an toan
        if (!hash_equals($expectedSig, $providedSig)) {
            return null;
        }

        $payload = json_decode(self::base64UrlDecode($payloadB64), true);
        if (!is_array($payload)) return null;

        // Kiem tra het han
        if (isset($payload['exp']) && time() >= $payload['exp']) {
            return null;
        }

        return $payload;
    }
}
