<?php

$change_words = array();
$change_words['lord'] = 'lords';
$change_words['spirit'] = 'spirits';

$proper_nouns = array();
$proper_nouns['gods'] = 'God';
$proper_nouns['lords'] = 'Lord';
$proper_nouns['spirits'] = 'Spirit';
$proper_nouns['the lords'] = 'The Lord'; /// Or should this be The LORD or the Lord?
$proper_nouns['of the lords'] = 'of the Lord'; /// LORD?
$proper_nouns['for the lords'] = 'for the Lord'; /// LORD?
$proper_nouns['and the lords'] = 'and the Lord'; /// LORD?
$proper_nouns['the lords and'] = 'the Lord and'; /// LORD?
$proper_nouns['of gods'] = 'of God';
$proper_nouns['for gods'] = 'For God'; /// for?
$proper_nouns['gods of'] = 'God of';
$proper_nouns['gods and'] = 'God and';
$proper_nouns['gods which'] = 'God which';
$proper_nouns['gods shall'] = 'God shall';


change_words($change_words);
add_proper_nouns($proper_nouns);