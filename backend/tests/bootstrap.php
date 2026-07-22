<?php

putenv('DB_CONNECTION=sqlite');
putenv('DB_DATABASE=:memory:');

$_ENV['DB_CONNECTION'] = $_SERVER['DB_CONNECTION'] = 'sqlite';
$_ENV['DB_DATABASE'] = $_SERVER['DB_DATABASE'] = ':memory:';

require dirname(__DIR__).'/vendor/autoload.php';
