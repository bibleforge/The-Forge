<?php

echo "Enter language: ";
$lang = trim(fgets(STDIN));

require 'config.php';

$db = mysql_connect(HOST, USER, PASS);
mysql_select_db(BASE, $db);

if(mysql_num_rows(mysql_query("SHOW TABLES LIKE 'bible_". $lang ."'"))) {
    require 'helpers/create_verses.php';
    create_verses($lang);
} else {
    echo 'Error: The table `bible_' . $lang . "` does not exist.\n";
}
