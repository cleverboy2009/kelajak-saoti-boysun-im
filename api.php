<?php
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, X-Admin-Token');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit; }

define('DATA_FILE', __DIR__ . '/data.json');
define('ADMIN_LOGIN', 'boysunkelajak06');
define('ADMIN_PASS',  'boysun2026');
define('TOKEN_SECRET','ks_' . md5(ADMIN_LOGIN . ADMIN_PASS . 'salt2026'));

// ---- helpers ----
function readData(): array {
    if (!file_exists(DATA_FILE)) return ['5-8'=>[],'9-11'=>[]];
    $raw = file_get_contents(DATA_FILE);
    $data = json_decode($raw, true);
    return is_array($data) ? $data : ['5-8'=>[],'9-11'=>[]];
}

function writeData(array $data): bool {
    return file_put_contents(DATA_FILE, json_encode($data, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT)) !== false;
}

function isAdmin(): bool {
    $token = $_SERVER['HTTP_X_ADMIN_TOKEN'] ?? '';
    return $token === TOKEN_SECRET;
}

function err(string $msg, int $code = 400): void {
    http_response_code($code);
    echo json_encode(['success'=>false,'error'=>$msg], JSON_UNESCAPED_UNICODE);
    exit;
}

function ok(mixed $data = null): void {
    echo json_encode(['success'=>true,'data'=>$data], JSON_UNESCAPED_UNICODE);
    exit;
}

function nextId(array $list): int {
    if (empty($list)) return 1;
    return max(array_column($list, 'id')) + 1;
}

// ---- router ----
$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';

// === GET ===
if ($method === 'GET') {
    if ($action === 'get' || $action === '') {
        ok(readData());
    }
    if ($action === 'token_check') {
        echo json_encode(['valid' => isAdmin()]);
        exit;
    }
    err('Unknown action', 404);
}

// === POST ===
if ($method === 'POST') {
    $body = json_decode(file_get_contents('php://input'), true) ?? [];

    // --- login ---
    if ($action === 'login') {
        $login = trim($body['login'] ?? '');
        $pass  = trim($body['password'] ?? '');
        if ($login === ADMIN_LOGIN && $pass === ADMIN_PASS) {
            ok(['token' => TOKEN_SECRET]);
        }
        err('Login yoki parol noto\'g\'ri', 401);
    }

    // All other POST require admin token
    if (!isAdmin()) err('Ruxsat yo\'q', 403);

    $data  = readData();
    $grade = trim($body['grade'] ?? '');

    if ($action === 'add') {
        if (!in_array($grade, ['5-8','9-11'])) err('Grade noto\'g\'ri');
        $topic = [
            'id'     => nextId($data[$grade]),
            'hafta'  => (int)($body['hafta']   ?? 1),
            'title'  => trim($body['title']   ?? ''),
            'qisqa'  => trim($body['qisqa']   ?? ''),
            'content'=> trim($body['content'] ?? ''),
            'date'   => trim($body['date']    ?? date('Y-m-d')),
            'rang'   => trim($body['rang']    ?? '#00c6ff'),
        ];
        if (!$topic['title']) err('Mavzu nomi bo\'sh');
        $data[$grade][] = $topic;
        writeData($data);
        ok($topic);
    }

    if ($action === 'update') {
        if (!in_array($grade, ['5-8','9-11'])) err('Grade noto\'g\'ri');
        $id = (int)($body['id'] ?? 0);
        foreach ($data[$grade] as &$t) {
            if ($t['id'] === $id) {
                $t['hafta']   = (int)($body['hafta']   ?? $t['hafta']);
                $t['title']   = trim($body['title']   ?? $t['title']);
                $t['qisqa']   = trim($body['qisqa']   ?? $t['qisqa']);
                $t['content'] = trim($body['content'] ?? $t['content']);
                $t['date']    = trim($body['date']    ?? $t['date']);
                $t['rang']    = trim($body['rang']    ?? $t['rang']);
                writeData($data);
                ok($t);
            }
        }
        err('Mavzu topilmadi', 404);
    }

    if ($action === 'delete') {
        if (!in_array($grade, ['5-8','9-11'])) err('Grade noto\'g\'ri');
        $id = (int)($body['id'] ?? 0);
        $before = count($data[$grade]);
        $data[$grade] = array_values(array_filter($data[$grade], fn($t) => $t['id'] !== $id));
        if (count($data[$grade]) === $before) err('Mavzu topilmadi', 404);
        writeData($data);
        ok();
    }

    err('Unknown action', 404);
}

err('Method not allowed', 405);
