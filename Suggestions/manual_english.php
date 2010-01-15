<?php

$change_words = array();
$change_words['lord'] = 'lords';
$change_words['spirit'] = 'spirits';

$proper_nouns = array();
$proper_nouns['gods'] = 'God';
$proper_nouns['lords'] = 'Lord';
$proper_nouns['spirits'] = 'Spirit';
$proper_nouns['the lords'] = 'The Lord'; /// Or should this be The LORD or the Lord?


change_words($change_words);
add_proper_nouns($proper_nouns);