this.translit = (function ()
{
    function translit_word(word, get_base_form)
    {
        var found_problem,
            pos = 0,
            orig_word,
            new_word = (function ()
            {
                var phonetic_units = [];
                
                // Array Remove - By John Resig (MIT Licensed)
                function remove_el(el, from, to)
                {
                    var rest = el.slice((to || from) + 1 || el.length);
                    el.length = from < 0 ? el.length + from : from;
                    return el.push.apply(el, rest);
                };
                
                return {
                    add_phonetic_unit: function (ipa, mod, sbl, info)
                    {
                        if (this.lang === "greek") {
                            /// Ignore the second double letter if word final.
                            if (pos > 0 && pos === orig_word.length - 1 && orig_word[pos] === orig_word[pos - 1]) {
                                this.sbl += sbl;
                                phonetic_units[phonetic_units.length - 1].sbl += phonetic_units[phonetic_units.length - 1].sbl;
                                return false;
                            }
                            
                            /// Set the default letter_count if none.
                            if (info.letter_count === undefined) {
                                info.letter_count = 1;
                            }
                        } else if (this.lang === "hebrew") {
                            
                            /// Don't double initial dagesh fortes.
                            if (info.dagesh === "forte" && this.last_c() === false) {
                                sbl = sbl.substr(0, sbl.length / 2);
                            }
                            
                            info.accented = this.hebrew_is_accented(pos, false, true);
                        }
                        
                        info.pos = pos;
                        info.letter = orig_word[pos];
                        
                        phonetic_units[phonetic_units.length] = {
                            ipa:  ipa,
                            mod:  mod,
                            sbl:  sbl,
                            info: info
                        };
                        
                        this.ipa += ipa;
                        this.mod += mod;
                        this.sbl += sbl;
                    },
                    hebrew_is_accented: function(the_pos, dont_check_unaccented, consider_meteg)
                    {
                        ///NOTE: [\u05bc-\u05c7]* is to skip over other points.
                        var regex = /.[\u05bc-\u05c5]*[\u0591-\u05af]/g,
                            accent_info,
                            i = 0,
                            word_with_accents = word.replace("\u05c3", "");
                        
                        if (the_pos === undefined) {
                            the_pos = pos;
                        }
                        
                        while (true) {
                            accent_info = regex.exec(word_with_accents);
                            
                            if (accent_info === null) {
                                break;
                            }
                            
                            if (accent_info.index === the_pos + i) {
                                return true;
                            }
                            
                            i += 1;
                        }
                        
                        /// Are there no accents.
                        if (!dont_check_unaccented && !/[\u0591-\u05af]/g.test(word_with_accents)) {
                            if (consider_meteg) {
                                /// Is it at the end of a word and there is no meteg before it?
                                return (/^[\u05d0-\u05ea]\u05bc?$/.test(orig_word.substr(the_pos + 1)) && !/\u05bd/.test(orig_word.substr(0, the_pos - 1)));
                            }
                            /// Is this the last syllalbe?
                            return (/^[\u05d0-\u05ea]\u05bc?$/.test(orig_word.substr(the_pos + 1)));
                        }
                        
                        return false;
                    },
                    add_info: function (info)
                    {
                        var data;
                        
                        if (phonetic_units.length === 0) {
                            return false;
                        }
                        
                        for (data in info) {
                            phonetic_units[phonetic_units.length - 1].info[data] = info[data];
                        }
                    },
                    last_type: function ()
                    {
                        if (phonetic_units.length === 0) {
                            return false;
                        }
                        return phonetic_units[phonetic_units.length - 1].info.type;
                    },
                    last_c: function ()
                    {
                        var i;
                        
                        for (i = phonetic_units.length - 1; i >= 0; i -= 1) {
                            if (phonetic_units[i].info.type === "c") {
                                return phonetic_units[i].info.letter;
                            }
                        }
                        
                        return false;
                    },
                    last_c_info: function (skip_count)
                    {
                        var i;
                        
                        if (skip_count === undefined) {
                            skip_count = 0;
                        }
                        
                        for (i = phonetic_units.length - 1; i >= 0; i -= 1) {
                            if (phonetic_units[i].info.type === "c") {
                                if (skip_count > 0) {
                                    skip_count -= 1;
                                } else {
                                    return phonetic_units[i].info;
                                }
                            }
                        }
                        
                        return false;
                    },
                    last_v: function ()
                    {
                        var i;
                        
                        for (i = phonetic_units.length - 1; i >= 0; i -= 1) {
                            if (phonetic_units[i].info.type === "v") {
                                return phonetic_units[i].info.letter;
                            }
                        }
                        
                        return false;
                    },
                    last_v_info: function (skip_count)
                    {
                        var i;
                        
                        if (skip_count === undefined) {
                            skip_count = 0;
                        }
                        
                        for (i = phonetic_units.length - 1; i >= 0; i -= 1) {
                            if (phonetic_units[i].info.type === "v") {
                                if (skip_count > 0) {
                                    skip_count -= 1;
                                } else {
                                    return phonetic_units[i].info;
                                }
                            }
                        }
                        
                        return false;
                    },
                    rebuild_words: function ()
                    {
                        var i,
                            len = phonetic_units.length;
                        
                        this.ipa = "";
                        this.sbl = "";
                        this.mod = "";
                        
                        for (i = 0; i < len; i += 1) {
                            this.ipa += phonetic_units[i].ipa;
                            this.sbl += phonetic_units[i].sbl;
                            this.mod += phonetic_units[i].mod;
                        }
                    },
                    switch_last_two: function ()
                    {
                        var tmp = phonetic_units[phonetic_units.length - 1];
                        phonetic_units[phonetic_units.length - 1] = phonetic_units[phonetic_units.length - 2];
                        phonetic_units[phonetic_units.length - 2] = tmp;
                        phonetic_units[phonetic_units.length - 1].info.furtive_patach = true;
                        phonetic_units[phonetic_units.length - 2].info.furtive_patach = true;
                        
                        this.rebuild_words();
                    },
                    shorten_final_dagesh_forte: function ()
                    {
                        if (this.last_type() === "c" && this.last_c_info().dagesh === "forte") {
                            phonetic_units[phonetic_units.length - 1].sbl = phonetic_units[phonetic_units.length - 1].sbl.substr(phonetic_units[phonetic_units.length - 1].sbl.length / 2);
                        }
                        this.rebuild_words();
                    },
                    remove_silient_aleph: function ()
                    {
                        var i;
                        
                        for (i = phonetic_units.length - 2; i > 0; i -= 1) {
                            /// Is it an aleph surrounded by consonants?
                            if (phonetic_units[i].info.letter === "\u05d0" && ((phonetic_units[i - 1].info.type === "c" && phonetic_units[i + 1].info.type === "c") || (phonetic_units[i + 1].info.type === "c" && (!phonetic_units[i + 2] || phonetic_units[i + 2].info.type === "c")))) {
                                remove_el(phonetic_units, i);
                            }
                        }
                        
                        this.rebuild_words();
                    },
                    syllablize_hebrew: function ()
                    {
                        var i,
                            len = phonetic_units.length,
                            has_multiple_syllables;
                        
                        function add_syllable_break(which, type)
                        {
                            if (which !== 0 && phonetic_units[which - 1].info.dagesh === "forte") {
                                if (type === ".") {
                                    ///NOTE: Do not add the normal syllalble break because it belongs to both syllables.
                                    phonetic_units[which - 1].mod = type + phonetic_units[which - 1].mod;   
                                } else {
                                    phonetic_units[which - 1].info.base_ipa = phonetic_units[which - 1].ipa;
                                    phonetic_units[which - 1].info.dagesh_base_form = phonetic_units[which - 1].ipa;
                                    phonetic_units[which - 1].ipa = phonetic_units[which - 1].info.ipa_stress_form.replace("_", type);
                                    phonetic_units[which - 1].mod = type + phonetic_units[which - 1].mod;
                                }
                                phonetic_units[which - 1].info.stress_type = type;
                            } else {
                                phonetic_units[which].info.stress_type = type;
                                phonetic_units[which].ipa = type + phonetic_units[which].ipa;
                                phonetic_units[which].mod = type + phonetic_units[which].mod;
                            }
                        }
                        
                        function syllable_is_accented(which)
                        {
                            var i = which;
                            
                            while (true) {
                                /// If there are no more letter or if it comes across a dagesh forte, quit (dagesh fortes go with the next syllable if it is not last)
                                if (!phonetic_units[i] || (i > which && phonetic_units[i].info.dagesh === "forte" && i < phonetic_units[i].length - 1)) {
                                    return false;
                                }
                                
                                if (phonetic_units[i].info.accented) {
                                    return true;
                                }
                                
                                /// If the next letter starts a new syllable, stop here.
                                if (phonetic_units[i].info.syllable_division) {
                                    return false;
                                }
                                
                                i += 1;
                            }
                        }
                        
                        function syllable_has_secondary_stress(which)
                        {
                            var i = which;
                            
                            while (true) {
                                if (!phonetic_units[i] || (i > which && phonetic_units[i].info.dagesh === "forte")) {
                                    return false;
                                }
                                
                                if (phonetic_units[i].info.secondary_stress) {
                                    return true;
                                }
                                
                                //if (phonetic_units[i].info.syllable_division && !(i === which && phonetic_units[i].info.dagesh === "forte")) {
                                if (phonetic_units[i].info.syllable_division) {
                                    return false;
                                }
                                i += 1;
                            }
                        }
                        
                        /// If there are no syllables, then stop now.
                        if (len === 0) {
                            return;
                        }
                        
                        for (i = 0; i < len - 1; i += 1) {
                            /// Skip anything already marked as a syllable division.
                            ///NOTE: Syllalbe division occur after (or in the case of dagesh fortes in the middle of) the syllable.
                            if (!phonetic_units[i].info.syllable_division) {
                                /// Dagesh fortes are divided
                                /// Word initial dagesh fortes should not have a syllable break.
                                if (phonetic_units[i].info.dagesh === "forte" && i > 0) {
                                    phonetic_units[i].info.syllable_division = true;
                                /// Two of the same types in a row require a break.
                                } else if (phonetic_units[i].info.type === phonetic_units[i + 1].info.type) {
                                    phonetic_units[i].info.syllable_division = true;
                                /// If we find VCV, there is a break after the first V.
                                } else if (phonetic_units[i].info.type === "v" && (phonetic_units[i + 1].info.type === "c" && phonetic_units[i + 1].info.dagesh !== "forte") && (phonetic_units[i + 2] && phonetic_units[i + 2].info.type === "v")) {
                                    phonetic_units[i].info.syllable_division = true;
                                }
                                
                                /// Make sure vowels before dagesh fortes are not set to divide syllables.
                                if (phonetic_units[i].info.syllable_division && phonetic_units[i].info.type === "v" && phonetic_units[i + 1].info.type === "c" && phonetic_units[i + 1].info.dagesh === "forte") {
                                    phonetic_units[i].info.syllable_division = false;
                                }
                            }
                        }
                        
                        /// Remove syllable division from the first letter if the first two letters are a vowel and consonant pair.
                        /// If they are both consonants or vowels there should be a syllable break (but the word is probably incorrectly spelled).
                        if (phonetic_units[0].info.syllable_division && phonetic_units[0].info.type === "c" && (phonetic_units[1] && phonetic_units[1].info.type === "c")) {
                            phonetic_units[0].info.syllable_division = false;
                        }
                        
                        /// If there are no accents or metegs and the last syllable is not a furtive patah, mark it as accented.
                        if (!/[\u0591-\u05af\u05bd]/.test(word)) {
                            (function ()
                            {
                                var mark_as_accented = 0;
                                
                                for (i = phonetic_units.length - 2; i >= 0; i -= 1) {
                                    if (phonetic_units[i].info.syllable_division && !phonetic_units[i + 1].info.furtive_patach) {
                                        mark_as_accented = i + 1;
                                        break;
                                    }
                                }
                                
                                if (!phonetic_units[mark_as_accented].info.furtive_patach) {
                                    phonetic_units[mark_as_accented].info.accented = true;
                                }
                            }());
                        }
                        
                        
                        /// Because stress only needs to be marked if there is more than one syllable, we need to determine if there is more than one.
                        for (i = 0; i < len - 1; i += 1) {
                            if (phonetic_units[i].info.syllable_division) {
                                has_multiple_syllables = true;
                                break;
                            }
                        }
                        
                        for (i = 0; i < len; i += 1) {
                            /// If it is a syllable break of the first syllable, add a syllable divider or stress mark (the first syllable only can get a stress mark)
                            if ((i === 0 && has_multiple_syllables) || (i > 0 && phonetic_units[i - 1].info.syllable_division)) {
                                if (syllable_is_accented(i)) {
                                    add_syllable_break(i, "ˈ");
                                } else if (syllable_has_secondary_stress(i)) {
                                    add_syllable_break(i, "ˌ");
                                } else if (i !== 0) {
                                    add_syllable_break(i, ".");
                                }
                            }
                        }
                        
                        /*
                        if ("" === translit.word.replace(/\ufb2a/g, "\u05e9\u05c1").replace(/\ufb2b/g, "\u05e9\u05c2")) {
                            console.log(phonetic_units);
                        }
                        */
                        
                        this.rebuild_words();
                    },
                    normalize: function (str, ignore_diaresis)
                    {
                        if (ignore_diaresis) {
                            return str.replace(/[ςϛ]/g, "σ").replace(/[άὰᾶἀἄἂἆἁἅἃἇᾱᾰᾳᾴᾲᾷᾀᾄᾂᾆᾁᾅᾃᾇ]/g, "α").replace(/[έὲἐἔἒἑἕἓ]/g, "ε").replace(/[ήὴῆἠἤἢἦἡἥἣἧῃῄῂῇᾐᾔᾒᾖᾑᾕᾓᾗ]/g, "η").replace(/[ίὶῖἰἴἲἶἱἵἳἷῑῐ]/g, "ι").replace(/[όὸὀὄὂὁὅὃ]/g, "ο").replace(/[ύὺῦὐὔὒὖὑὕὓὗῡῠ]/g, "υ").replace(/[ώὼῶὠὤὢὦὡὥὣὧῳῴῲῷᾠᾤᾢᾦᾡᾥᾣᾧ]/g, "ω").replace(/[ῤῥ]/g, "ρ");
                        }
                        return str.replace(/[ςϛ]/g, "σ").replace(/[άὰᾶἀἄἂἆἁἅἃἇᾱᾰᾳᾴᾲᾷᾀᾄᾂᾆᾁᾅᾃᾇ]/g, "α").replace(/[έὲἐἔἒἑἕἓ]/g, "ε").replace(/[ήὴῆἠἤἢἦἡἥἣἧῃῄῂῇᾐᾔᾒᾖᾑᾕᾓᾗ]/g, "η").replace(/[ίὶῖἰἴἲἶἱἵἳἷϊΐῒῗῑῐ]/g, "ι").replace(/[όὸὀὄὂὁὅὃ]/g, "ο").replace(/[ύὺῦὐὔὒὖὑὕὓὗϋΰῢῧῡῠ]/g, "υ").replace(/[ώὼῶὠὤὢὦὡὥὣὧῳῴῲῷᾠᾤᾢᾦᾡᾥᾣᾧ]/g, "ω").replace(/[ῤῥ]/g, "ρ");
                    },
                    greek_lower_case: function (orig)
                    {
                        ///NOTE: In order to convert to upper case, it must also include final sigma.
                        var upper = "ΑΒΓΔΕΖΗΘΙΚΛΜΝΞΟΠΡΣΤΥΦΧΨΩᾼῌῼΆΈΉΊΌΎΏᾺῈῊῚῸῪῺἈἘἨἸὈὨᾈᾘᾨἌἜἬἼὌὬᾌᾜᾬἊἚἪἺὊὪᾊᾚᾪἎἮἾὮᾎᾞᾮἉἙἩἹὉὙὩᾉᾙᾩῬἍἝἭἽὍὝὭᾍᾝᾭἋἛἫἻὋὛὫᾋᾛᾫἏἯἿὟὯᾏᾟᾯΪΫᾹῙῩᾸῘῨ",
                            lower = "αβγδεζηθικλμνξοπρστυφχψωᾳῃῳάέήίόύώὰὲὴὶὸὺὼἀἐἠἰὀὠᾀᾐᾠἄἔἤἴὄὤᾄᾔᾤἂἒἢἲὂὢᾂᾒᾢἆἦἶὦᾆᾖᾦἁἑἡἱὁὑὡᾁᾑᾡῥἅἕἥἵὅὕὥᾅᾕᾥἃἓἣἳὃὓὣᾃᾓᾣἇἧἷὗὧᾇᾗᾧϊϋᾱῑῡᾰῐῠ",
                            i,
                            len = orig.length, 
                            pos,
                            str = "";
                        
                        for (i = 0; i < len; i += 1) {
                            pos = upper.indexOf(orig[i]);
                            str += (pos >= 0) ? lower[pos] : orig[i];
                        }
                        
                        return str;
                    },
                    syllablize_greek: function ()
                    {
                        var i,
                            len,
                            has_multiple_syllables,
                            ///NOTE: "ρμδ" occurs once as a number.
                            valid_clusters3 = {"σπρ":1, "στρ":1, "σκρ":1, "σφρ":1, "σπλ":1, "σκλ":1, "σκν":1},
                            valid_clusters2 = {
                                "βλ":1, "βρ":1, "βδ": 1,
                                "δρ":1,
                                "γρ":1, "γδ":1, "γλ":1, "γν":1,
                                "ζγ":1, "ζμ":1,
                                "θρ":1, "θλ":1, "θν":1,
                                "κσ":1, "κρ":1, "κλ":1, "κν":1,
                                "πτ":1, "πσ":1, "πρ":1, "πλ":1, "πν":1,
                                "τσ":1, "τρ":1, "τμ":1,
                                "σπ":1, "στ":1, "σκ":1, "σφ":1, "σχ":1, "σθ":1, "σμ":1, "σφ":1,
                                "φτ":1, "φρ":1, "φλ":1, "φν":1, "φθ":1,
                                "χτ":1, "χρ":1, "χλ":1, "χν":1,
                            },
                            ///NOTE: Must be ordered by length.
                            //prefixes = ["ελληνισ", "αγνωσ", "ιεροσ", "μερισ", "φιλοσ", "ελλην", "εξισ", "θεοσ", "προσ", "τρισ", "υπερ", "δισ", "εισ", "συν", "φιλ", "φωσ", "εκ", "εν", "εξ"],
                            prefixes = ["αγνωσ", "ιεροσ", "μερισ", "φιλοσ", "ελλην", "εξισ", "θεοσ", "προσ", "τρισ", "υπερ", "δισ", "εισ", "συν", "φιλ", "φωσ", "εκ", "εν", "εξ"],
                            
                            that = this,
                            base_word_first_letter,
                            compound_split = 0,
                            normalized_word = this.normalize(orig_word),
                            components = [];
    
                        /**
                        Consonant Clusters (modern)
                        2 Letter:
                                    
                                p- 	t- 	k- 	b- 	d- 	g- 	f- 	θ- 	s- 	x- 	v- 	ð- 	z- 	ɣ-
                            -p 									sp 					
                            -t 							ft 		st 	xt 				
                            -k 									sk 					
                            -f 									sf 					
                            -θ 									sθ 					
                            -s 	ps 	ts 	ks 											
                            -x 									sx 					
                            -v 													zv 	
                            -ð 											vð 			ɣð
                            -ɣ 											vɣ 		zɣ 	
                            -r 	pr 	tr 	kr 	br 	dr 	gr 	fr 	θr 		xr 	vr 	ðr 		ɣr
                            -l 	pl 		kl 	bl 		gl 	fl 	θl 		xl 	vl 			ɣl
                            -n 	pn 		kn 					θn 		xn 				ɣn
                            -m 		tm 											zm 	
                        
                        3 Letter:
                        
                            /spr str skr sfr spl skl skn/
                            
                        Prefixes
                            ελληνισ (?)
                            αγνωσ
                            ιεροσ
                            μερισ
                            φιλοσ
                            ελλην
                            εξισ
                            θεοσ
                            προσ
                            τρισσ
                            υπερ
                            δισ
                            εισ
                            συν
                            φιλ
                            φωσ
                            εκ
                            εν
                            εξ
                            
                        First, split the compound words and combind valid consonant clusters.
                        
                        Syllable Rules:
                            split at second vowel/diphthong => V.V
                            split between vowel followed by a single consonant/valid consonant cluster and a vowel =>  V.CV
                            split between non-valid consonant clusters => C.C
                            split between compound words => W.W
                            
                            /// Afterward, check for W.C.C => WC.C (i.e., it's not a compound word).
                        */
                        
                        function add_syllable_break(which, type)
                        {
                            phonetic_units[which].info.stress_type = type;
                            phonetic_units[which].ipa = type + phonetic_units[which].ipa;
                            phonetic_units[which].mod = type + phonetic_units[which].mod;
                        }
                        
                        function syllable_is_accented(which)
                        {
                            var i = which;
                            
                            while (true) {
                                if (!phonetic_units[i]) {
                                    return false;
                                }
                                
                                if (phonetic_units[i].info.accented) {
                                    return true;
                                }
                                
                                /// If the next letter starts a new syllable, stop here.
                                if (phonetic_units[i].info.syllable_division) {
                                    return false;
                                }
                                
                                i += 1;
                            }
                        }
                        
                        /// Because some phones are spelled with multiple Greek letters (e.g., diphthongs) and others are spelled with just a diacritic (i.e., /h/),
                        /// the length of a string in Greek does not match with the phonetic_unit array. This function makes the conversion.
                        function convert_length_to_phonetic_units_pos(pos)
                        {
                            var i = 0,
                                phonetic_pos = 0;
                            
                            while (true) {
                                if (!phonetic_units[i]) {
                                    return i;
                                }
                                if (phonetic_units[i].info.letter_count > 0) {
                                    if (phonetic_pos === pos) {
                                        return i;
                                    }
                                    phonetic_pos += phonetic_units[i].info.letter_count;
                                }
                                
                                i += 1;
                            }
                        }
                        
                        ///NOTE: This only works when supplying the base form. It does not yet detect it.
                        base_word_first_letter = (function ()
                        {
                            var letter;
                            
                            return function ()
                            {
                                if (letter) {
                                    return letter;
                                }
                                
                                if (typeof get_base_form === "function") {
                                    letter = get_base_form(word)[0];
                                /*
                                if (mysql && mysql.query) {
                                    mysql.query().execute("SELECT `lexicon_greek`.word FROM `bible_original`, `lexicon_greek` WHERE `bible_original`.word like  \"" + word + "\" AND `lexicon_greek`.strongs = `bible_original`.strongs LIMIT 1", [], function (err, data)
                                    {
                                        if (data && data[0] && data[0].word) {
                                            letter = data[0].word[0];
                                        } else {
                                            letter = word[0];
                                        }
                                    }, {async: false});
                                */
                                } else {
                                    letter = word[0];
                                }
                                
                                letter = that.normalize(that.greek_lower_case(letter));
                                
                                return letter;
                            }
                        }());
                        
                        /// If there are no syllables, stop now.
                        if (phonetic_units.length === 0) {
                            return;
                        }
                        
                        /// Step 1: Split possible compound words.
                        len = prefixes.length;
                        
                        ///TODO: In order to more accurately break up the syllables, it really needs to detect morphemes and determine the base form.
                        for (i = 0; i < len; i += 1) {
                            if (normalized_word.indexOf(prefixes[i]) === 0) {
                                ///TODO: Check to see if it is a valid split (not C or C.C).
                                /// Make sure that it splits it somewhere in the middle.
                                if (convert_length_to_phonetic_units_pos(prefixes[i].length) < phonetic_units.length) {
                                    /// Since an epsilon is added to the prefix to form the past tense, if the prefix begins with epsilon, check to make sure that the base form also begins with epsilon.
                                    if (prefixes[i][0] !== "ε" || base_word_first_letter() === "ε") {
                                        //console.log("prefix: " + prefixes[i]);
                                        compound_split = convert_length_to_phonetic_units_pos(prefixes[i].length);
                                        //console.log(compound_split);
                                        break;
                                    }
                                }
                            }
                        }
                        
                        ///TODO: Determine tense, since past tense adds an ε prefix! (same with εκ, etc.).
                        /// If it did not find a prefix, look for the "επ" prefix (a shortened form of "επι").
                        if (compound_split === 0) {
                            /// If there is "επ" follwed by a vowel that is not iota and the word is not "επος", split it.
                            ///NOTE: Due to normalization, "επος" becomes "εποσ".
                            if (normalized_word.indexOf("επ") === 0 && phonetic_units[2] && phonetic_units[2].info.type === "v" && that.normalize(phonetic_units[2].info.letter) !== "ι" && normalized_word !== "εποσ" && base_word_first_letter() === "ε") {
                                compound_split = 2;
                            }
                        }
                        
                        if (compound_split > 0) {
                            //console.log("orig:   " + translit.word.replace(/\ufb2a/g, "\u05e9\u05c1").replace(/\ufb2b/g, "\u05e9\u05c2"));
                            phonetic_units[compound_split - 1].info.syllable_division = true;
                        }
                        
                        
                        /// Mark the original ID so that it can be reffered to later.
                        for (i = phonetic_units.length - 1; i >= 0; i -= 1) {
                            phonetic_units[i].info.original_id = i;
                        }
                        
                        components[0] = phonetic_units.slice(0, compound_split);
                        components[1] = phonetic_units.slice(compound_split);
                        
                        /// Step 2: Combind valid consonant clusters in each part.
                        function combine_consonant_clusters(units)
                        {
                            for (i = 0; i < units.length - 1; i += 1) {
                                if (units[i].info.type === "c") {
                                    /// Is it a valid 3 letter cluster?
                                    ///NOTE: The letters are not normalized, but since only sigma and rho change and the non-normalized letter is never apart of a cluster, they do not need to be normalized.
                                    if (i + 2 < units.length && units[i + 1].info.type === "c" && units[i + 2].info.type === "c" && valid_clusters3[units[i].info.letter + units[i + 1].info.letter + units[i + 2].info.letter]) {
                                        units[i].info.cc_extra_len = 2;
                                        remove_el(units, i + 1, i + 2);
                                    /// Is it a valid 2 letter cluster?
                                    } else if (units[i + 1].info.type === "c" && valid_clusters2[units[i].info.letter + units[i + 1].info.letter]) {
                                        units[i].info.cc_extra_len = 1;
                                        remove_el(units, i + 1);
                                    } else {
                                        units[i].info.cc_extra_len = 0;
                                    }
                                }
                            }
                        }
                        
                        combine_consonant_clusters(components[0]);
                        combine_consonant_clusters(components[1]);
                        
                        function split_syllables(units)
                        {
                            var i,
                                len = units.length;
                            
                            for (i = 0; i < len - 1; i += 1) {
                                /// V.V
                                if (units[i].info.type === "v" && units[i + 1].info.type === "v") {
                                    //console.log("1 " + units[i].info.letter + "." + units[i + 1].info.letter);
                                    phonetic_units[units[i].info.original_id].info.syllable_division = true;
                                /// V.CV
                                } else if (units[i].info.type === "v" && units[i + 1].info.type === "c" && units[i + 2] && units[i + 2].info.type === "v") {
                                    //console.log("2 " + units[i].info.letter + "." + units[i + 1].info.letter);
                                    /*
                                    if (units[i + 1].info.cc_extra_len) {
                                        console.log("cluster 2 " + units[i].info.letter + "." + units[i + 1].info.letter + " from " + translit.word.replace(/\ufb2a/g, "\u05e9\u05c1").replace(/\ufb2b/g, "\u05e9\u05c2"));
                                    }
                                    */
                                    phonetic_units[units[i].info.original_id].info.syllable_division = true;
                                /// C.C
                                } else if (units[i].info.type === "c" && units[i + 1].info.type === "c") {
                                    //console.log("3 " + units[i].info.letter + "." + units[i + 1].info.letter);
                                    /*
                                    if (units[i].info.cc_extra_len || units[i + 1].info.cc_extra_len) {
                                        console.log("cluster 3 " + units[i].info.letter + "." + units[i + 1].info.letter + " from " + translit.word.replace(/\ufb2a/g, "\u05e9\u05c1").replace(/\ufb2b/g, "\u05e9\u05c2"));
                                    }
                                    */
                                    phonetic_units[units[i].info.original_id + units[i].info.cc_extra_len].info.syllable_division = true;
                                }
                            }
                        }
                        
                        split_syllables(components[0]);
                        split_syllables(components[1]);
                        
                        len = phonetic_units.length;
                        /// Because stress only needs to be marked if there is more than one syllable, we need to determine if there is more than one.
                        for (i = 0; i < len - 1; i += 1) {
                            if (phonetic_units[i].info.syllable_division) {
                                has_multiple_syllables = true;
                                break;
                            }
                        }
                        
                        for (i = 0; i < len; i += 1) {
                            /// If it is a syllable break of the first syllable, add a syllable divider or stress mark (the first syllable only can get a stress mark)
                            if ((i === 0 && has_multiple_syllables) || (i > 0 && phonetic_units[i - 1] && phonetic_units[i - 1].info.syllable_division)) {
                                if (syllable_is_accented(i)) {
                                    add_syllable_break(i, "ˈ");
                                } else if (i !== 0) {
                                    add_syllable_break(i, ".");
                                }
                            }
                        }
                        
                        /*
                        if ("" === translit.word.replace(/\ufb2a/g, "\u05e9\u05c1").replace(/\ufb2b/g, "\u05e9\u05c2")) {
                            console.log(phonetic_units);
                        }
                        */
                        
                        this.rebuild_words();
                        /*
                        if (compound_split > 0) {
                            console.log("final:  " + this.ipa + "\n");
                        }
                        */
                    },
                    create_dictionary_forms: function ()
                    {
                        var i,
                            len = phonetic_units.length,
                            syllables = [],
                            that = this,
                            ipa_unit,
                            mod_unit,
                            dic_unit,
                            has_no_primary_stress = (function ()
                            {
                                var i;
                                for (i = phonetic_units.length - 1; i >= 0; i -= 1) {
                                    if (phonetic_units[i].info.stress_type === "ˈ") {
                                        return false;
                                    }
                                }
                                return true;
                            }());
                        
                        function convert_to_dic(ipa_unit, pos, is_last)
                        {
                            var dic_unit = "";
                            
                            /// Remove tie bars, ejective, pharyngealization, extra short, non-syllabic, no audible release, fronting, lowered, length, syllable, and stress marks.
                            ipa_unit = ipa_unit.replace(/[\u02d0\u002e\u02c8\u02cc\u032a\u02e4\u0361\u2019\u0306\u032f\u031a\u031e]/g, "");
                            
                            switch (ipa_unit) {
                            /// Consonants
                            case "ʕ":
                            case "ʔ":
                                dic_unit = "";
                                break;
                            case "ʃ":
                                dic_unit = "sh";
                                break;
                            case "ɬ":
                                dic_unit = "s";
                                break;
                            case "ʁ":
                                dic_unit = "r";
                                break;
                            case "χ":
                            case "x":
                            case "ç":
                                /// Gutteral (not glottal) sounds are "h" at syllable initial and "k" syllable final.
                                if ((i === 0 || phonetic_units[pos].info.stress_type) && !is_last) {
                                    dic_unit = "h";
                                } else {
                                    /// Syllable final phones become "k"
                                    dic_unit = "k";
                                }
                                break;
                            case "h":
                            case "ħ":
                                /// Ignore syllable final H sounds.
                                if ((i === 0 || phonetic_units[pos].info.stress_type) && !is_last) {
                                    dic_unit = "h";
                                } else {
                                    dic_unit = "";
                                }
                                break;
                            case "j":
                                /// Ignore syllable final Y sounds.
                                if ((i === 0 || phonetic_units[pos].info.stress_type) && !is_last) {
                                    dic_unit = "y";
                                } else {
                                    dic_unit = "";
                                }
                                break;
                            case "w":
                                /// Ignore syllable final W sounds.
                                if ((i === 0 || phonetic_units[pos].info.stress_type) && !is_last) {
                                    dic_unit = "w";
                                } else {
                                    dic_unit = {skip: true};
                                }
                                break;
                            case "β":
                                dic_unit = "v";
                                break;
                            case "ŋ":
                                if ((i === 0 || phonetic_units[pos].info.stress_type) && !is_last) {
                                    dic_unit = "n";
                                } else {
                                    dic_unit = "ng";
                                }
                                break;
                            case "ɣ":
                            case "ʝ":
                                dic_unit = "g";
                                break;
                            case "ð":
                            case "θ":
                                dic_unit = "th";
                                break;
                            case "c":
                                dic_unit = "k";
                                break;
                            case "ɱ":
                                dic_unit = "m";
                                break;
                                
                            
                            /// Vowels
                            case "ɑi":
                            case "ɔi":
                                dic_unit = "ai";
                                break;
                            case "ɔu":
                                dic_unit = "ao";
                                break;
                            case "ɔ":
                                //dic_unit = {biblical: "aw", modern: {syllable_final: "a", syllable_medial1: "ah", syllable_initial: "a"}};
                                dic_unit = "aw";
                                break;
                            case "ɑ":
                                dic_unit = {syllable_final: "a", syllable_medial1: "ah", syllable_initial: "a", lone: "ah"};
                                break;
                            case "o":
                            case "ow":
                                ///NOTE: syllable_medial3 is added after syllable_medial1 if the following consonant is a consonant cluster.
                                dic_unit = {syllable_final: "oh", syllable_medial1: "o", syllable_medial2: "e", syllable_medial3: "h"};
                                break;
                            case "oi":
                                dic_unit = {syllable_final: "oy", syllable_medial1: "oi"};
                                break;
                            case "ui":
                                dic_unit = "ooee";
                                break;
                            case "ɑu":
                                dic_unit = "ao";
                                break;
                            case "e":
                            case "ei":
                            case "ɛi":
                                dic_unit = {syllable_final: "ay", syllable_medial1: "a", syllable_medial2: "e", syllable_medial3: "y", lone_stressed: "a"};
                                break;
                            case "ev":
                                dic_unit = {syllable_final: "ave", syllable_medial1: "ayv"};
                                break;
                            case "ɛ":
                                dic_unit = {syllable_final: "eh", syllable_medial1: "e"};
                                break;
                            case "ə":
                                dic_unit = {syllable_final: "uh", syllable_medial1: "u"};
                                break;
                            case "u":
                                dic_unit = "oo";
                                break;
                            case "i":
                            case "ɪi":
                                dic_unit = "ee";
                                break;
                            case "ɪu":
                            case "iu":
                                dic_unit = "eeoo";
                                break;
                            case "eyu":
                                dic_unit = "ayoo";
                                break;
                            case "ɪ":
                                dic_unit = {syllable_final: "ih", syllable_medial1: "i"};
                                break
                            case "y":
                                /// If we want to capture the fronted sound, we could use something like "ooee".
                                dic_unit = "oo";
                                break
                            case "ju":
                                dic_unit = "yoo";
                                break
                            
                            /// Greek vowel + consonant combinations
                            case "ɛβ":
                                dic_unit = "ev";
                                break
                            case "ɑv":
                            case "ɑβ":
                                dic_unit = "av";
                                break
                            case "ɑf":
                                dic_unit = "af";
                                break
                            case "ev":
                            case "eβ":
                                dic_unit = {syllable_final: "ayv", lone: "ave"};
                                break
                            case "ef":
                                dic_unit = {syllable_final: "ayf", lone: "afe"};
                                break
                            case "iv":
                                dic_unit = {syllable_final: "eev", lone: "eve"};
                                break
                            case "if":
                                dic_unit = "eef";
                                break
                            case "":
                            default:
                                /// Most consonants are the same.
                                dic_unit = ipa_unit;
                            }
                            
                            return dic_unit;
                        }
                        
                        /// Reset the words to an empty string.
                        that.dic_biblical = "";
                        that.dic_modern   = "";
                        
                        for (i = 0; i < len; i += 1) {
    
                            if (phonetic_units[i].info.dagesh_base_form) {
                                ipa_unit = phonetic_units[i].info.dagesh_base_form;
                            } else {
                                ipa_unit = phonetic_units[i].ipa;
                            }
                            mod_unit = phonetic_units[i].mod;
                            
                            dic_unit = {biblical: convert_to_dic(ipa_unit, i), modern: convert_to_dic(mod_unit, i)};
                            
                            if (i === 0 || phonetic_units[i].info.stress_type) {
                                syllables[syllables.length] = {stressed: (phonetic_units[i].info.stress_type === "ˈ" || (has_no_primary_stress && phonetic_units[i].info.stress_type === "ˌ")), units: []};
                            }
                            
                            if (dic_unit.biblical === "" && dic_unit.modern !== "") {
                                dic_unit.biblical = {skip: true};
                            }
                            if (dic_unit.modern === "" && dic_unit.biblical !== "") {
                                dic_unit.modern = {skip: true};
                            }
                            
                            if (dic_unit.biblical !== "" && dic_unit.modern !== "") {
                                if (phonetic_units[i].info.dagesh === "forte" && phonetic_units[i].info.ipa_stress_form) {
                                    if (i === 0 || i === len - 1) {
                                        /// Use phoneme like normal.
                                        syllables[syllables.length - 1].units[syllables[syllables.length - 1].units.length] = dic_unit;
                                    } else {
                                        /// Split the phoneme into two syllables.
                                        (function ()
                                        {
                                            var dic_unit1,
                                                dic_unit2,
                                                split_ipa = phonetic_units[i].info.ipa_stress_form.split("_");
                                            
                                            dic_unit1 = convert_to_dic(split_ipa[0], i, true);
                                            dic_unit2 = convert_to_dic(split_ipa[1], i);
                                            /// first half
                                            /// If it does not equal ""
                                            if (dic_unit1 !== "") {
                                                //dic_unit1.modern = {skip: true};
                                                //syllables[syllables.length - 2].units[syllables[syllables.length - 2].units.length] = dic_unit1;
                                                if (syllables[syllables.length - 2]) {
                                                    syllables[syllables.length - 2].units[syllables[syllables.length - 2].units.length] = {biblical: dic_unit1, modern: {skip: true}};
                                                }
                                            }
                                            /// second half
                                            if (dic_unit2 !== "") {
                                                /// The modern pronunciation should not change.
                                                //dic_unit2.modern = dic_unit.modern || dic_unit.biblical;
                                                syllables[syllables.length - 1].units[syllables[syllables.length - 1].units.length] = {biblical: dic_unit2, modern: dic_unit.modern};
                                            }
                                        }());
                                    }
                                } else {
                                    syllables[syllables.length - 1].units[syllables[syllables.length - 1].units.length] = dic_unit;
                                }
                                if (dic_unit.biblical === "" && dic_unit.modern !== "") {
                                    dic_unit.biblical = {skip: true};
                                }
                                if (dic_unit.modern === "" && dic_unit.biblical !== "") {
                                    dic_unit.modern = {skip: true};
                                }
                            }
                        }
                        
                        (function ()
                        {
                            var determine_unit,
                                j,
                                len2;
                            
                            determine_unit = (function ()
                            {
                                var add_to_beginning = {},
                                    add_to_end = {};
                                
                                return function (unit, type)
                                {
                                    var str = "";
                                    /// If it is a string, it is the same in all situations.
                                    if (typeof unit === "string") {
                                        if (add_to_beginning[type]) {
                                            if (unit.length > 1 || (syllables[i].units[j + 1] && syllables[i].units[j + 1][type] && !syllables[i].units[j + 1][type].skip)) {
                                                //console.log("a " + translit.id);
                                                str += add_to_beginning[type];
                                                add_to_end[type] = "";
                                            }
                                            add_to_beginning[type] = "";
                                        }
                                        str += unit;
                                        if (add_to_end[type]) {
                                            str += add_to_end[type];
                                            add_to_end[type] = "";
                                        }
                                    /// Is it alone and stressed?
                                    } else if (j === 0 && unit.lone_stressed && syllables[i].stressed && (!syllables[i].units[j + 1] || (syllables[i].units[j + 1][type] && syllables[i].units[j + 1][type].skip))) {
                                        str += unit.lone_stressed;
                                    /// Is it alone (stressed or unstressed)?
                                    } else if (j === 0 && unit.lone && (!syllables[i].units[j + 1] || (syllables[i].units[j + 1][type] && syllables[i].units[j + 1][type].skip))) {
                                        str += unit.lone;
                                    /// Is it initial?
                                    } else if (j === 0 && unit.syllable_initial) {
                                        str += unit.syllable_initial;
                                    /// Is it medial?
                                    } else if (unit.syllable_medial1 && syllables[i].units[j + 1] && !(syllables[i].units[j + 1][type] && syllables[i].units[j + 1][type].skip)) {
                                        if (unit.syllable_medial2) {
                                            add_to_end[type] = unit.syllable_medial2;
                                        }
                                        if (unit.syllable_medial3) {
                                            add_to_beginning[type] = unit.syllable_medial3;
                                        }
                                        str += unit.syllable_medial1;
                                    ///NOTE: It must be final, but still check to make sure that it exists.
                                    } else if (unit.syllable_final) {
                                        if (add_to_beginning[type]) {
                                            if (unit.syllable_final.length > 1 || (syllables[i].units[j + 1] && syllables[i].units[j + 1][type] && !syllables[i].units[j + 1][type].skip)) {
                                                //console.log("b " + translit.id);
                                                str += add_to_beginning[type];
                                                add_to_end[type] = "";
                                            }
                                            add_to_beginning[type] = "";
                                        }
                                        str += unit.syllable_final;
                                        if (add_to_end[type]) {
                                            str += add_to_end[type];
                                            add_to_end[type] = "";
                                        }
                                    } else if (unit.skip) {
                                        str = "";
                                    }
                                    
                                    if (syllables[i].stressed) {
                                        str = str.toUpperCase();
                                    }
                                    
                                    return str;
                                };
                            }());
                            
                            len = syllables.length;
                            
                            for (i = 0; i < len; i += 1) {
                                len2 = syllables[i].units ? syllables[i].units.length : 0;
                                
                                for (j = 0; j < len2; j += 1) {
                                    /// Add syllable breaks
                                    if (j === 0 && that.dic_biblical !== "") {
                                        that.dic_biblical += "-";
                                        that.dic_modern += "-";
                                    }
                                    
                                    that.dic_biblical += determine_unit(syllables[i].units[j].biblical, "biblical");
                                    that.dic_modern   += determine_unit(syllables[i].units[j].modern, "modern");
                                }
                            }
                        }());
                    },
                    
                    ipa: "", /// Biblical Hebrew (IPA)
                    sbl: "", /// Society of Bible Literature (ISO 259)
                    mod: "", /// Modern Hebrew (IPA)
                    dic_biblical: "",
                    dic_modern: ""
                };
            }());
        
        found_problem = (function ()
        {
            function to_unicode(letter)
            {
                return "\\u0" + dechex(ord(letter));
            }
            
            function ord(string)
            {
                // http://kevin.vanzonneveld.net
                // +   original by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
                // +   bugfixed by: Onno Marsman
                // +   improved by: Brett Zamir (http://brett-zamir.me)
                // +   input by: incidence
                // *     example 1: ord('K');
                // *     returns 1: 75
                // *     example 2: ord('\uD800\uDC00'); // surrogate pair to create a single Unicode character
                // *     returns 2: 65536
                var str = string + '',
                    code = str.charCodeAt(0);
                if (0xD800 <= code && code <= 0xDBFF) { // High surrogate (could change last hex to 0xDB7F to treat high private surrogates as single characters)
                    var hi = code;
                    if (str.length === 1) {
                        return code; // This is just a high surrogate with no following low surrogate, so we return its value;
                        // we could also throw an error as it is not a complete character, but someone may want to know
                    }
                    var low = str.charCodeAt(1);
                    return ((hi - 0xD800) * 0x400) + (low - 0xDC00) + 0x10000;
                }
                if (0xDC00 <= code && code <= 0xDFFF) { // Low surrogate
                    return code; // This is just a low surrogate with no preceding high surrogate, so we return its value;
                    // we could also throw an error as it is not a complete character, but someone may want to know
                }
                return code;
            }
            
            function dechex(number)
            {
                // http://kevin.vanzonneveld.net
                // +   original by: Philippe Baumann
                // +   bugfixed by: Onno Marsman
                // +   improved by: http://stackoverflow.com/questions/57803/how-to-convert-decimal-to-hex-in-javascript
                // +   input by: pilus
                // *     example 1: dechex(10);
                // *     returns 1: 'a'
                // *     example 2: dechex(47);
                // *     returns 2: '2f'
                // *     example 3: dechex(-1415723993);
                // *     returns 3: 'ab9dc427'
                if (number < 0) {
                    number = 0xFFFFFFFF + number + 1;
                }
                return parseInt(number, 10).toString(16);
            }
            
            return function(letter)
            {
                console.log("word:    " + word);
                if (letter) {
                    console.log("letter:  " + orig_word[pos]);
                    console.log("unicode: " + to_unicode(orig_word[pos]));
                    console.log("pos:     " + pos);
                } else {
                    console.log("Something does not match!");
                }
                console.log("--------");
                console.log("ipa:     " + new_word.ipa);
                console.log("modern:  " + new_word.mod);
                console.log("sbl new: " + new_word.sbl);
                console.log("");
            };
        }());
        
        function translit_greek()
        {
            var accented,
                diphthong_obj,
                len,
                letter,
                rough_breathing;
            
            function is_accented(letter)
            {
                return "άέήίόύώᾴῄῴὰὲὴὶὸὺὼᾲῂῲᾶῆῖῦῶᾷῇῷἄἔἤἴὄὔὤᾄᾔᾤἂἒἢἲὂὒὢᾂᾒᾢἆἦἶὖὦᾆᾖᾦἅἕἥἵὅὕὥᾅᾕᾥἃἓἣἳὃὓὣᾃᾓᾣἇἧἷὗὧᾇᾗᾧΐΰῒῢῗῧ".indexOf(letter) !== -1;
            }
            
            function has_rough_breathing(letter)
            {
                return "ἁἑἡἱὁὑὡᾁᾑᾡῥἅἕἥἵὅὕὥᾅᾕᾥἃἓἣἳὃὓὣᾃᾓᾣἇἧἷὗὧᾇᾗᾧ".indexOf(letter) !== -1;
            }
            
            function is_voiced(letter)
            {
                return "θκξπσςτφχψ".indexOf(letter) === -1;
            }
            
            function is_front_vowel(letter)
            {
                return "ιυε".indexOf(letter) !== -1;
            }
            
            function has_diaeresis(letter)
            {
                return "ϊΐῒῗϋΰῢῧ".indexOf(letter) !== -1;
            }
            
            function has_iota_subscript(letter)
            {
                return "ᾳῃῳᾴῄῴᾲῂῲᾷῇῷᾀᾐᾠᾄᾔᾤᾂᾒᾢᾆᾖᾦᾁᾑᾡᾅᾕᾥᾃᾓᾣᾇᾗᾧ".indexOf(letter) !== -1;
            }
            
            /// Remove punctuation, if any.
            orig_word = new_word.greek_lower_case(word.replace(/[,.;·'᾽’]/g, ""));
            
            if (word.replace(/[,.;·'᾽]/g, "") === "Α") {
                word = "άλφα";
                orig_word = word;
            } else if (word.replace(/[,.;·'᾽]/g, "") === "Ω") {
                word = "ωμέγα";
                orig_word = word;
            }
            
            ///NOTE: This must be after changing the words to "άλφα" or "ωμέγα".
            len = orig_word.length;
                
            while (pos < len) {
                letter = orig_word[pos];
                accented = is_accented(letter);
                rough_breathing = has_rough_breathing(letter);
                
                switch (new_word.normalize(letter)) {
                case "β":
                    new_word.add_phonetic_unit("β", "v", "b", {type: "c"});
                    break;
                case "γ":
                    /// The nasals tend to assimilate to following consonants in place of articulation; thus there is a Eng before /k, ɣ, x/).
                    if (pos + 1 !== len && (orig_word[pos + 1] === "γ" || orig_word[pos + 1] === "κ" || orig_word[pos + 1] === "ξ" || orig_word[pos + 1] === "χ")) {
                        new_word.add_phonetic_unit("ŋ", "ŋ", "n", {type: "c"});
                    } else {
                        /// When preceeding a front vowel, it becomes ʝ in modern Greek.
                        if (pos + 1 !== len && is_front_vowel(orig_word[pos + 1])) {
                            new_word.add_phonetic_unit("ɣ", "ʝ", "g", {type: "c"});
                        } else {
                            new_word.add_phonetic_unit("ɣ", "ɣ", "g", {type: "c"});
                        }
                    }
                    break;
                case "δ":
                    new_word.add_phonetic_unit("ð", "ð", "d", {type: "c"});
                    break;
                case "ζ":
                    new_word.add_phonetic_unit("z", "z", "z", {type: "c"});
                    break;
                case "θ":
                    new_word.add_phonetic_unit("θ", "θ", "th", {type: "c"});
                    break;
                case "κ":
                    /// Kappa becomes palatalized before front vowels
                    if (pos + 1 !== len && is_front_vowel(orig_word[pos + 1])) {
                        new_word.add_phonetic_unit("k", "c", "k", {type: "c"});
                    } else {
                        new_word.add_phonetic_unit("k", "k", "k", {type: "c"});
                    }
                    break;
                case "λ":
                    new_word.add_phonetic_unit("l", "l", "l", {type: "c"});
                    break;
                case "μ":
                    /// Mu becomes a Labiodental nasal [ɱ] before /f/ and /v/
                    if (pos + 1 !== len && (orig_word[pos + 1] === "φ" || orig_word[pos + 1] === "β")) {
                        new_word.add_phonetic_unit("m", "ɱ", "m", {type: "c"});
                    } else {
                        new_word.add_phonetic_unit("m", "m", "m", {type: "c"});
                    }
                    break;
                case "ν":
                    /// Nu is dentalized when preceeding interdentals.
                    if (pos + 1 !== len && (orig_word[pos + 1] === "θ" || orig_word[pos + 1] === "δ")) {
                        new_word.add_phonetic_unit("n", "n̪", "n", {type: "c"});
                    } else {
                        new_word.add_phonetic_unit("n", "n", "n", {type: "c"});
                    }
                    break;
                case "σ":
                    ///NOTE: Final sigma (ς) has been normalized to normal sigma (σ).
                    new_word.add_phonetic_unit("s", "s", "s", {type: "c"});
                    break;
                case "ρ":
                    //if (pos + 1 !== len && (normalize(orig_word[pos + 1]) === "ρ")) {
                    //    new_word.add_phonetic_unit("r", "r", "rrh", {type: "c"});
                    //    pos += 1;
                    //} else {
                        if (rough_breathing) {
                            new_word.add_phonetic_unit("r", "r", "rh", {type: "c"});
                        } else {
                            new_word.add_phonetic_unit("r", "r", "r", {type: "c"});
                        }
                    //}
                    break;
                case "τ":
                    /// Tau is dentalized when preceeding interdentals.
                    if (pos + 1 !== len && (orig_word[pos + 1] === "θ" || orig_word[pos + 1] === "δ")) {
                        new_word.add_phonetic_unit("t", "t̪", "t", {type: "c"});
                    } else {
                        new_word.add_phonetic_unit("t", "t", "t", {type: "c"});
                    }
                    break;
                case "π":
                    /// Pi is dentalized when preceeding /f/.
                    if (pos + 1 !== len && orig_word[pos + 1] === "φ") {
                        new_word.add_phonetic_unit("p", "p̪", "p", {type: "c"});
                    } else {
                        new_word.add_phonetic_unit("p", "p", "p", {type: "c"});
                    }
                    break;
                case "χ":
                    /// Chi becomes palatalized before front vowels
                    if (pos + 1 !== len && is_front_vowel(orig_word[pos + 1])) {
                        new_word.add_phonetic_unit("x", "ç", "ch", {type: "c"});
                    } else {
                        new_word.add_phonetic_unit("x", "x", "ch", {type: "c"});
                    }
                    break;
                case "φ":
                    new_word.add_phonetic_unit("f", "f", "ph", {type: "c"});
                    break;
                case "ξ":
                    new_word.add_phonetic_unit("k͡s", "k͡s", "x", {type: "c"});
                    break;
                case "ψ":
                    new_word.add_phonetic_unit("p͡s", "p͡s", "ps", {type: "c"});
                    break;
                
                /// Vowels
                case "α":
                    if (rough_breathing) {
                        new_word.add_phonetic_unit("h", "", "h", {type: "c", letter_count: 0});
                    }
                    if (!accented && pos + 1 !== len && !has_iota_subscript(letter) && new_word.normalize(orig_word[pos + 1], true) === "ι") {
                        accented = is_accented(orig_word[pos + 1]);
                        rough_breathing = has_rough_breathing(orig_word[pos + 1]);
                        if (rough_breathing) {
                            new_word.add_phonetic_unit("h", "", "h", {type: "c", letter_count: 0});
                        }
                        new_word.add_phonetic_unit("ɛ", "e", "ai", {type: "v", position: "back", accented: accented, diphthong: true, diphthong_letters: letter + orig_word[pos + 1], letter_count: 2});
                        pos += 1;
                    } else if (!accented && pos + 1 !== len && !has_iota_subscript(letter) && new_word.normalize(orig_word[pos + 1], true) === "υ") {
                        accented = is_accented(orig_word[pos + 1]);
                        rough_breathing = has_rough_breathing(orig_word[pos + 1]);
                        if (rough_breathing) {
                            new_word.add_phonetic_unit("h", "", "h", {type: "c", letter_count: 0});
                        }
                        if (pos + 2 !== len && is_voiced(orig_word[pos + 2])) {
                            new_word.add_phonetic_unit("ɛβ", "a", "au", {type: "v", position: "front", accented: accented, diphthong: true, diphthong_letters: letter + orig_word[pos + 1], letter_count: 2});
                        } else {
                            new_word.add_phonetic_unit("ɑβ", "ɑf", "au", {type: "v", position: "front", accented: accented, diphthong: true, diphthong_letters: letter + orig_word[pos + 1], letter_count: 2});
                        }
                        pos += 1;
                    } else {
                        new_word.add_phonetic_unit("ɑ", "ɑ", "a", {type: "v", position: "front", accented: accented});
                    }
                    break;
                case "ι":
                    if (rough_breathing) {
                        new_word.add_phonetic_unit("h", "", "h", {type: "c", letter_count: 0});
                    }
                    if (!has_diaeresis(letter) && new_word.last_type() === "v" && !is_accented(orig_word[pos - 1]) && !has_iota_subscript(orig_word[pos - 1]) && !new_word.last_v_info().diphthong && (new_word.normalize(new_word.last_v_info().letter) === "ε" || new_word.normalize(new_word.last_v_info().letter) === "α" || new_word.normalize(new_word.last_v_info().letter, true) === "υ" || new_word.normalize(new_word.last_v_info().letter) === "ο")) {
                        console.log("Should be a diphthong, maybe.");
                        found_problem(letter);
                        return false();
                    }
                    new_word.add_phonetic_unit("i", "i", "i", {type: "v", position: "front", accented: accented});
                    break;
                case "ε":
                    if (rough_breathing) {
                        new_word.add_phonetic_unit("h", "", "h", {type: "c", letter_count: 0});
                    }
                    if (!accented && pos + 1 !== len && new_word.normalize(orig_word[pos + 1], true) === "ι") {
                        accented = is_accented(orig_word[pos + 1]);
                        rough_breathing = has_rough_breathing(orig_word[pos + 1]);
                        if (rough_breathing) {
                            new_word.add_phonetic_unit("h", "", "h", {type: "c", letter_count: 0});
                        }
                        new_word.add_phonetic_unit("i", "i", "ei", {type: "v", position: "front", accented: accented, diphthong: true, diphthong_letters: letter + orig_word[pos + 1], letter_count: 2});
                        pos += 1;
                    } else if (!accented && pos + 1 !== len && new_word.normalize(orig_word[pos + 1], true) === "υ") {
                        accented = is_accented(orig_word[pos + 1]);
                        rough_breathing = has_rough_breathing(orig_word[pos + 1]);
                        if (rough_breathing) {
                            new_word.add_phonetic_unit("h", "", "h", {type: "c", letter_count: 0});
                        }
                        if (pos + 2 !== len && is_voiced(orig_word[pos + 2])) {
                            new_word.add_phonetic_unit("ɛβ", "ev", "eu", {type: "v", position: "front", accented: accented, diphthong: true, diphthong_letters: letter + orig_word[pos + 1], letter_count: 2});
                        } else {
                            new_word.add_phonetic_unit("ɛβ", "ef", "eu", {type: "v", position: "front", accented: accented, diphthong: true, diphthong_letters: letter + orig_word[pos + 1], letter_count: 2});
                        }
                        pos += 1;
                    } else {
                        new_word.add_phonetic_unit("ɛ", "e̞", "e", {type: "v", position: "front", accented: accented});
                    }
                    break;
                case "η":
                    if (rough_breathing) {
                        new_word.add_phonetic_unit("h", "", "h", {type: "c", letter_count: 0});
                    }
                    if (!accented && pos + 1 !== len && !has_iota_subscript(letter) && new_word.normalize(orig_word[pos + 1], true) === "υ") {
                        accented = is_accented(orig_word[pos + 1]);
                        rough_breathing = has_rough_breathing(orig_word[pos + 1]);
                        if (rough_breathing) {
                            new_word.add_phonetic_unit("h", "", "h", {type: "c", letter_count: 0});
                        }
                        if (pos + 2 !== len && is_voiced(orig_word[pos + 2])) {
                            new_word.add_phonetic_unit("eβ", "iv", "ēu", {type: "v", position: "front", accented: accented, diphthong: true, diphthong_letters: letter + orig_word[pos + 1], letter_count: 2});
                        } else {
                            new_word.add_phonetic_unit("eβ", "if", "ēu", {type: "v", position: "front", accented: accented, diphthong: true, diphthong_letters: letter + orig_word[pos + 1], letter_count: 2});
                        }
                        pos += 1;
                    } else {
                        new_word.add_phonetic_unit("e", "e̞", "ē", {type: "v", position: "front", accented: accented});
                    }
                    break;
                case "ο":
                    if (rough_breathing) {
                        new_word.add_phonetic_unit("h", "", "h", {type: "c", letter_count: 0});
                    }
                    if (!accented && pos + 1 !== len && new_word.normalize(orig_word[pos + 1], true) === "υ") {
                        accented = is_accented(orig_word[pos + 1]);
                        rough_breathing = has_rough_breathing(orig_word[pos + 1]);
                        if (rough_breathing) {
                            new_word.add_phonetic_unit("h", "", "h", {type: "c", letter_count: 0});
                        }
                        new_word.add_phonetic_unit("u", "u", "ou", {type: "v", position: "back", accented: accented, diphthong: true, diphthong_letters: letter + orig_word[pos + 1], letter_count: 2});
                        pos += 1;
                    } else if (!accented && pos + 1 !== len && new_word.normalize(orig_word[pos + 1], true) === "ι") {
                        accented = is_accented(orig_word[pos + 1]);
                        rough_breathing = has_rough_breathing(orig_word[pos + 1]);
                        if (rough_breathing) {
                            new_word.add_phonetic_unit("h", "", "h", {type: "c", letter_count: 0});
                        }
                        new_word.add_phonetic_unit("y", "y", "oi", {type: "v", position: "back", accented: accented, diphthong: true, diphthong_letters: letter + orig_word[pos + 1], letter_count: 2});
                        pos += 1;
                    } else {
                        new_word.add_phonetic_unit("o", "ow", "o", {type: "v", position: "back", accented: accented});
                    }
                    break;
                case "υ":
                    if (rough_breathing) {
                        new_word.add_phonetic_unit("h", "", "h", {type: "c", letter_count: 0});
                    }
                    if (!accented && pos + 1 !== len && new_word.normalize(orig_word[pos + 1], true) === "ι") {
                        accented = is_accented(orig_word[pos + 1]);
                        rough_breathing = has_rough_breathing(orig_word[pos + 1]);
                        if (rough_breathing) {
                            new_word.add_phonetic_unit("h", "", "h", {type: "c", letter_count: 0});
                        }
                        new_word.add_phonetic_unit("y", "ju", "ui", {type: "v", position: "front", accented: accented, diphthong: true, diphthong_letters: letter + orig_word[pos + 1], letter_count: 2});
                        pos += 1;
                    } else {
                        if (!has_diaeresis(letter) && new_word.last_type() === "v" && !is_accented(orig_word[pos - 1]) && !has_iota_subscript(orig_word[pos - 1]) && !new_word.last_v_info().diphthong && (new_word.normalize(new_word.last_v_info().letter) === "ε" || new_word.normalize(new_word.last_v_info().letter) === "α" || new_word.normalize(new_word.last_v_info().letter) === "η" || new_word.normalize(new_word.last_v_info().letter) === "ω" || new_word.normalize(new_word.last_v_info().letter) === "ο")) {
                            console.log("Should be a diphthong, maybe.");
                            found_problem(letter);
                            return false;
                        }
                        if (new_word.last_type() !== "v") {
                            new_word.add_phonetic_unit("y", "ju", "y", {type: "v", position: "front", accented: accented});
                        } else {
                            new_word.add_phonetic_unit("y", "ju", "u", {type: "v", position: "front", accented: accented});
                        }
                    }
                    break;
                case "ω":
                    if (rough_breathing) {
                        new_word.add_phonetic_unit("h", "", "h", {type: "c", letter_count: 0});
                    }
                    new_word.add_phonetic_unit("o", "ow", "ō", {type: "v", position: "back", accented: accented});
                    break;
                default:
                    console.log("Encountered an unknown symbol.");
                    found_problem(letter);
                    return false;
                }
                pos += 1;
            }
            
            new_word.syllablize_greek();
        }
        
        function translit_hebrew()
        {
            var diphthong_obj,
                has_dagesh,
                has_rafe,
                //last_sin_shin,
                len,
                letter;
            
            function accents_count()
            {
                var count = 0,
                    regex = /[\u0591-\u05af]/g;
                
                while (regex.exec(word)) {
                    count += 1;
                }
                
                return count;
            }
            
            function has_extra_qamets_chatuph(correct, questionable)
            {
                var i;
                
                for (i = correct.length - 1; i >= 0; i -= 1) {
                    if (correct[i] !== questionable[i] && correct[i] !== "ā" && questionable[i] !== "o") {
                        return false;
                    }
                }
                return true;
            }
            
            function just_qamets_chatuph_or_sheva(correct, questionable)
            {
                var i1 = -1,
                    i2 = -1,
                    len = correct.length > questionable.length ? correct.length : questionable.length;
                
                
                while (true) {
                    i1 += 1;
                    i2 += 1;
                    
                    if (i1 >= len && i2 >= len) {
                        break;
                    }
                    
                    if (correct[i1] !== questionable[i2] && !(correct[i1] === "ā" && questionable[i2] === "o" || correct[i1] === "o" && questionable[i2] === "ā")) {
                        if (correct[i1] === "ĕ") {
                            i2 -= 1;
                        } else if (questionable[i2] === "ĕ") {
                            i1 -= 1;
                        } else {
                            return false;
                        }
                    }
                }
                return true;
            }
            
            function diphthong()
            {
                ///NOTE: /[^\u05b0-\u05bb\u05bc]/ Checks for vowel points or a dagesh
                /// Check for Yod.
                if (orig_word[pos + 1] === "\u05d9" && (orig_word[pos + 2] === undefined || orig_word[pos + 2].match(/[^\u05b1-\u05bb\u05bc]/))) {
                    /// If there is a Sheva (Shva) below yod, it is a vowel if the current syllalbe is accented.
                    if (orig_word[pos + 2] === "\u05b0" && new_word.hebrew_is_accented() === true) {
                        return false;
                    }
                    
                    /// If the yod is accented, it's not a diphthong.
                    if (new_word.hebrew_is_accented(pos + 1, true)) {
                        return false;
                    }
                    
                    /// Yod + Vav
                    ///NOTE: There should be no dagesh in the vav or holam.
                    if (orig_word[pos + 2] === "\u05d5") {
                        if (orig_word[pos + 3] === undefined || (orig_word[pos + 3] !== "\u05bc" && orig_word[pos + 3] !== "\u05b9")) {
                            return {
                                letter:   "\u05d9\u05d5",
                                skip_amt: 2
                            };
                        }
                        
                        /// If there is a dagesh in the vav then it is a vowel, so the yod is not a diphthong.
                        return false;
                    }
                    
                    return {
                        letter: "\u05d9",
                        skip_amt: 1
                    };
                /// Meteg + Yod
                } else if (orig_word[pos + 1] === "\u05bd" && orig_word[pos + 2] === "\u05d9" && (orig_word[pos + 3] === undefined || orig_word[pos + 3].match(/[^\u05b1-\u05bb\u05bc]/))) {
        
                    // /// If there is a Sheva (Shva) below yod, it is a vowel if the current syllable is accented.
                    //if (orig_word[pos + 3] === "\u05b0" && new_word.hebrew_is_accented()) {
                    /// If there is a Sheva (Shva) below yod, it is a vowel.
                    if (orig_word[pos + 3] === "\u05b0") {
                        return false;
                    }
                    
                    /// If the yod is accented, it's not a diphthong.
                    if (new_word.hebrew_is_accented(pos + 2, true)) {
                        return false;
                    }
                    
                    return {
                        letter:   "\u05d9",
                        skip_amt: 2,
                        meteg:    true
                    };
                }
                
                ///NOTE: A non-Biblical Hebrew diphthong is yod + yod + patah (ײַ)
                
                return false;
            }
            
            /// Remove punctuation, if any.
            orig_word = word.replace("\u05c3", "").replace(/[\u0591-\u05af\u05c0\u05c4\u05c5]/g, "");
            len = orig_word.length;
            
            /**
              Lene or Forte?
                The Begedkephat letters (Bet, Gimmel, Dalet, Kaf, Pey, and Tav) can take either a dagesh lene or a dagesh forte.
                Since the dots appear identical in the letters, how can we tell if a given Begedkephat letter has a lene or a forte dot?
                The rule goes like this: the dagesh in a Begedkephat letter is chazak (forte) only if it is preceded by a vowel (otherwise it is lene).
                All others have dagesh forte.
                Dagesh lene turns it into a plosive.
            */
            while (pos < len) {
                letter = orig_word[pos];
                
                has_dagesh = orig_word[pos + 1] === "\u05bc";
                
                if (has_dagesh) {
                    has_rafe = orig_word[pos + 2] === "\u05bf";
                } else {
                    has_rafe = orig_word[pos + 1] === "\u05bf";
                }
                
                
                switch (letter) {
                case "\u05d0": /// aleph א
                    /// Is it a matres lectionis?
                    /// Is it last and following a consonant?
                    if (pos === len - 1 && new_word.last_type() === "c") {
                        break;
                    } else {
                        if (has_dagesh) {
                            new_word.add_phonetic_unit("ʔː", "ʔ", "ʾ", {type: "c"});
                            pos += 1;
                        } else {
                            new_word.add_phonetic_unit("ʔ", "ʔ", "ʾ", {type: "c"});
                        }
                    }
                    break;
                case "\u05d1": /// beth
                    if (has_dagesh) {
                        if (new_word.last_type() === "v" && !has_rafe) {
                            new_word.add_phonetic_unit("bː", "b", "bb", {type: "c", dagesh: "forte", ipa_stress_form: "b̚_b"});
                        } else {
                            new_word.add_phonetic_unit("b", "b", "b", {type: "c", dagesh: "lene", rafe: has_rafe});
                        }
                        pos += 1;
                    } else {
                        new_word.add_phonetic_unit("b", "v", "b", {type: "c", rafe: has_rafe});
                    }
                    if (has_rafe) {
                        pos += 1;
                    }
                    break;
                case "\u05d2": /// gimel
                    if (has_dagesh) {
                        if (new_word.last_type() === "v" && !has_rafe) {
                            new_word.add_phonetic_unit("ɡː", "ɡ", "gg", {type: "c", dagesh: "forte", ipa_stress_form: "g̚_g"});
                        } else {
                            new_word.add_phonetic_unit("ɡ", "ɡ", "g", {type: "c", dagesh: "lene", rafe: has_rafe});
                        }
                        pos += 1;
                    } else {
                        new_word.add_phonetic_unit("ɡ", "ɡ", "g", {type: "c", rafe: has_rafe});
                    }
                    if (has_rafe) {
                        pos += 1;
                    }
                    break;
                case "\u05d3": /// dalet
                    if (has_dagesh) {
                        if (new_word.last_type() === "v" && !has_rafe) {
                            new_word.add_phonetic_unit("d̪ː", "d", "dd", {type: "c", dagesh: "forte", ipa_stress_form: "d̪̚_d̪"});
                        } else {
                            new_word.add_phonetic_unit("d̪", "d", "d", {type: "c", dagesh: "lene", rafe: has_rafe});
                        }
                        pos += 1;
                    } else {
                        new_word.add_phonetic_unit("d̪", "d", "d", {type: "c", rafe: has_rafe});
                    }
                    if (has_rafe) {
                        pos += 1;
                    }
                    break;
                case "\u05dc": /// lamed
                    if (has_dagesh) {
                        new_word.add_phonetic_unit("lː", "l", "ll", {type: "c", dagesh: "forte", ipa_stress_form: "l_l"});
                        pos += 1;
                    } else {
                        new_word.add_phonetic_unit("l", "l", "l", {type: "c"});
                    }
                    break;
                case "\u05de": /// mem
                case "\u05dd": /// final mem
                    if (has_dagesh) {
                        new_word.add_phonetic_unit("mː", "m", "mm", {type: "c", dagesh: "forte", ipa_stress_form: "m_m"});
                        pos += 1;
                    } else {
                        new_word.add_phonetic_unit("m", "m", "m", {type: "c"});
                    }
                    break;
                case "\u05e0": /// nun
                case "\u05df": /// final nun
                    if (has_dagesh) {
                        new_word.add_phonetic_unit("n̪ː", "n", "nn", {type: "c", dagesh: "forte", ipa_stress_form: "n_n"});
                        pos += 1;
                    } else {
                        new_word.add_phonetic_unit("n̪", "n", "n", {type: "c"});
                    }
                    break;
                case "\u05ea": /// tav / tau
                    if (has_dagesh) {
                        if (new_word.last_type() === "v" && !has_rafe) {
                            new_word.add_phonetic_unit("t̪ː", "t", "tt", {type: "c", dagesh: "forte", ipa_stress_form: "t̪̚_t̪"});
                        } else {
                            new_word.add_phonetic_unit("t̪", "t", "t", {type: "c", dagesh: "lene", rafe: has_rafe});
                        }
                        pos += 1;
                    } else {
                        new_word.add_phonetic_unit("t̪", "t", "t", {type: "c", rafe: has_rafe});
                    }
                    if (has_rafe) {
                        pos += 1;
                    }
                    break;
                case "\u05e8": /// resh ר
                    if (has_dagesh) {
                        ///NOTE: The prounication is probably unknown, but written as double "r" in the LXX.
                        new_word.add_phonetic_unit("rː", "ʁ", "rr", {type: "c", dagesh: "forte", ipa_stress_form: "r_r"});
                        pos += 1;
                    } else {
                        new_word.add_phonetic_unit("r", "ʁ", "r", {type: "c"});
                    }
                    break;
                case "\u05e6": /// tsade
                case "\u05e5": /// final tsade
                    if (has_dagesh) {
                        new_word.add_phonetic_unit("t͡sˤː", "t͡s", "ṣṣ", {type: "c", dagesh: "forte", ipa_stress_form: "t͡sˤ_sˤ"});
                        pos += 1;
                    } else {
                        new_word.add_phonetic_unit("t͡sˤ", "t͡s", "ṣ", {type: "c"});
                    }
                    break;
                case "\u05d7": /// het / chet
                    if (has_dagesh) {
                        new_word.add_phonetic_unit("ħː", "χ", "ḥḥ", {type: "c", dagesh: "forte", ipa_stress_form: "ħ_ħ"});
                        pos += 1;
                    } else {
                        new_word.add_phonetic_unit("ħ", "χ", "ḥ", {type: "c"});
                    }
                    break;
                case "\u05db": /// kaf / kaph
                case "\u05da": /// final kaf / kaph
                    if (has_dagesh) {
                        if (new_word.last_type() === "v" && !has_rafe) {
                            new_word.add_phonetic_unit("kː", "k", "kk", {type: "c", dagesh: "forte", ipa_stress_form: "k̚_k"});
                        } else {
                            new_word.add_phonetic_unit("k", "k", "k", {type: "c", dagesh: "lene", rafe: has_rafe});
                        }
                        pos += 1;
                    } else {
                        new_word.add_phonetic_unit("k", "χ", "k", {type: "c", rafe: has_rafe});
                    }
                    if (has_rafe) {
                        pos += 1;
                    }
                    break;
                case "\u05e2": /// ayin
                    if (has_dagesh) {
                        /// Can it have a dagesh?
                        new_word.add_phonetic_unit("ʕː", "ʕ", "ʿʿ", {type: "c", dagesh: "forte", ipa_stress_form: "ʕ_ʕ"});
                        pos += 1;
                    } else {
                        ///NOTE: Ayin appears to have had two phonemes in Biblical Hebrew, both velar [ɣ] and pharengeal [ʕ].
                        ///      Is there a way to disginguish? Maybe by using the LXX. They tranliterated the velar form but not the pharengeal (see AncientHebrewPhonology.pdf).
                        new_word.add_phonetic_unit("ʕ", "ʕ", "ʿ", {type: "c"});
                    }
                    break;
                case "\u05e4": /// pe / pey
                case "\u05e3": /// final pe / pey
                    if (has_dagesh) {
                        if (new_word.last_type() === "v" && !has_rafe) {
                            new_word.add_phonetic_unit("pː", "p", "pp", {type: "c", dagesh: "forte", ipa_stress_form: "p̚_p"});
                        } else {
                            new_word.add_phonetic_unit("p", "p", "p", {type: "c", dagesh: "lene", rafe: has_rafe});
                        }
                        pos += 1;
                    } else {
                        new_word.add_phonetic_unit("p", "f", "p", {type: "c", rafe: has_rafe});
                    }
                    if (has_rafe) {
                        pos += 1;
                    }
                    break;
                case "\u05e7": /// qof / kaf
                    if (has_dagesh) {
                        new_word.add_phonetic_unit("k’ː", "k", "qq", {type: "c", dagesh: "forte", ipa_stress_form: "k̚_k’"});
                        pos += 1;
                    } else {
                        ///NOTE: Ayin appears to have had two phonemes in Biblical Hebrew, both velar [ɣ] and pharengeal [ʕ].
                        ///      Is there a way to disginguish? Maybe by using the LXX. They tranliterated the velar form but not the pharengeal (see AncientHebrewPhonology.pdf).
                        new_word.add_phonetic_unit("k’", "k", "q", {type: "c"});
                    }
                    break;
                case "\u05d6": /// zayin
                    if (has_dagesh) {
                        new_word.add_phonetic_unit("d͡zː", "z", "zz", {type: "c", dagesh: "forte", ipa_stress_form: "d͡z_z"});
                        pos += 1;
                    } else {
                        new_word.add_phonetic_unit("d͡z", "z", "z", {type: "c"});
                    }
                    break;
                case "\u05d8": /// tet
                    if (has_dagesh) {
                        new_word.add_phonetic_unit("t̪’ː", "t", "ṭṭ", {type: "c", dagesh: "forte", ipa_stress_form: "t̪̚_t̪’"});
                        pos += 1;
                    } else {
                        new_word.add_phonetic_unit("t̪’", "t", "ṭ", {type: "c"});
                    }
                    break;
                case "\u05e1": /// samech / samekh
                    ///NOTE: Could also be pronunced t͡s.
                    if (has_dagesh) {
                        new_word.add_phonetic_unit("sː", "s", "ss", {type: "c", dagesh: "forte", ipa_stress_form: "s_s"});
                        pos += 1;
                    } else {
                        new_word.add_phonetic_unit("s", "s", "s", {type: "c"});
                    }
                    break;
                
                
                case "\u05e9": /// sin or shin
                    /*
                    if (last_sin_shin) {
                        orig_word = orig_word.substr(0, pos) + last_sin_shin + orig_word.substr(pos + 1);
                        letter = last_sin_shin;
                    } else {
                        console.log("Unknown sin/shin");
                        found_problem();
                    }
                    */
                    /// Extra sin/shin seems to be ignored in accepted pronunciation.
                    /// See יִשָּׂשכָֽר׃ (Issachar strongs 3485).
                    break;
                case "\ufb2a": /// shin
                case "\ufb2b": /// sin
                    (function ()
                    {
                        var ipa_letter,
                            sbl_letter,
                            mod_letter;
                        
                        // not any more /// sin/shin have an extra point, so the dagesh is not next.
                        //has_dagesh = orig_word[pos + 2] === "\u05bc";
                        
                        /// shin
                        if (orig_word[pos] === "\ufb2a") {
                            //new_word.add_phonetic_unit("ʃ", "š", {type: "c"});
                            ipa_letter = "ʃ";
                            sbl_letter = "š";
                            mod_letter = "ʃ";
                        } else if (orig_word[pos] === "\ufb2b") {
                            //new_word.add_phonetic_unit("ɬ", "s", {type: "c"});
                            ipa_letter = "ɬ";
                            /// Final sin seems to be symbolized differently in the sbl.
                            sbl_letter = "ś";
                            mod_letter = "s";
                        }
                        
                        if (has_dagesh) {
                            new_word.add_phonetic_unit(ipa_letter + "ː", mod_letter + "ː", sbl_letter + sbl_letter, {type: "c", dagesh: "forte", ipa_stress_form: ipa_letter + "_" + ipa_letter});
                            pos += 1;
                        } else {
                            new_word.add_phonetic_unit(ipa_letter, mod_letter, sbl_letter, {type: "c"});
                        }
                    }());
                    
                    //pos += 1;
                    break;
                
                /// Sometimes consontants, sometimes vowels
                    case "\u05d4": /// he / hey
                    /// Is it at the very end?
                    if (pos + 1 === len && new_word.last_type() === "v") {
                        /// Skip unpronounced Matres lectionis.
                        //console.log(to_unicode(new_word.last_v_info().letter));
                        //console.log(new_word.hebrew_is_accented(pos, true));
                        ///TODO: Determine if the "h" is this supposed to be part of the vowel?
                        //if (new_word.hebrew_is_accented(pos, true) && (new_word.last_v_info().letter === "\u05b5" || new_word.last_v_info().letter === "\u05b6")) {
                        if (new_word.hebrew_is_accented(pos, true)) {
                            new_word.add_phonetic_unit("h", "h", "h", {type: "c"});
                        }
    //              } else if (new_word.last_type() !== "c") {
                    } else if (pos + 1 === len && new_word.last_type() === "c") {
                        /// Only pronounce final heys following consonants if they are accented (which probably never happens).
                        if (new_word.hebrew_is_accented(pos, true)) {
                            new_word.add_phonetic_unit("h", "h", "h", {type: "c"});
                        }
                    } else {
                        //if (has_dagesh && pos + 2 !== len) {
                        //    console.log("A non-final hey with dagesh");
                        //    found_problem();
                        //} else {
                            new_word.add_phonetic_unit("h", "h", "h", {type: "c"});
                        //}
    //              } else {
    //                  console.log("Does it have a Mappiq (https://en.wikipedia.org/wiki/Mappiq)?");
    //                  found_problem();
                    }
                    
                    if (has_dagesh) {
                        pos += 1;
                    }
                    break;
                case "\u05d9": /// yod
                    /*
                    syllable.has_dagesh = has_dagesh(pos);
                    /// Is it used as a consonant?
                    if (is_open(pos)) {
                        add_c("y", "j", "y");
                    } else {
                        add_v("ee", "i", "?");
                    }
                    */
                    //if (new_word.last_type() !== "c") {
                        if (has_dagesh) {
                            new_word.add_phonetic_unit("jː", "j", "yy", {type: "c", dagesh: "forte", ipa_stress_form: "j_j"});
                            pos += 1;
                        } else {
                            new_word.add_phonetic_unit("j", "j", "y", {type: "c"});
                        }
                    //} else {
                    //    found_problem();
                    //}
                    break;
                case "\u05d5": /// vav / wav / waw / vaw
                    /*
                    /// Is it a holam male? (i.e., a vowel)
                    if (word[pos + 1] === "\u05b9") {
                        /// skip
                    } else {
                        syllable.has_dagesh = has_dagesh(pos);
                        found_problem();
                    }
                    */
                    /// Is it a holam male? (i.e., a vowel)
                    if (orig_word[pos + 1] === "\u05b9") {
                        /// skip
                    } else {
                        //syllable.has_dagesh = has_dagesh(pos);
                        /// Is the "dagesh" actually a Shuruk (Shureq)?
                        if (has_dagesh && (new_word.last_type() === "c" || pos === 0 || pos + 2 === len)) {
                            if ((diphthong_obj = diphthong())) {
                                if (diphthong_obj.letter === "\u05d9") { /// shuruk yod
                                    new_word.add_phonetic_unit("ui̯", "ui̯", "ûy", {type: "v", len: "long", diphthong: true, secondary_stress: diphthong_obj.meteg});
                                    pos += diphthong_obj.skip_amt;
                                } else {
                                    console.log("Encountered an unknown dipthong.");
                                    found_problem(letter);
                                    return false;
                                }
                            } else {
                                new_word.add_phonetic_unit("uː", "u", "û", {type: "v", len: "long"});
                            }
                            pos += 1;
                        } else {
                            if (has_dagesh) {
                                new_word.add_phonetic_unit("wː", "w", "ww", {type: "c", dagesh: "forte", ipa_stress_form: "w_w"});
                                pos += 1;
                            } else {
                                new_word.add_phonetic_unit("w", "v", "w", {type: "c"});
                            }
                        }
                    }
                    break;
                
                /// Vowels
                case "\u05b8": /// qamtas
                    /*
                    add_v("aw", "ɔː", "aw");
                    syllable.reduced = false;
                    */
                    if ((diphthong_obj = diphthong())) {
                        if (diphthong_obj.letter === "\u05d9") { /// qamets yod
                            //if (new_word.hebrew_is_accented() || diphthong_obj.meteg) {
                                new_word.add_phonetic_unit("ɔi̯ː", "ɑi̯ː", "āy", {type: "v", len: "long", diphthong: true, secondary_stress: diphthong_obj.meteg});
                            //} else {
                            //    new_word.add_phonetic_unit("oi̯", "oi̯", "oy", {type: "v", len: "long", diphthong: true, secondary_stress: diphthong_obj.meteg});
                            //}
                            pos += diphthong_obj.skip_amt;
                        } else if (diphthong_obj.letter === "\u05d9\u05d5") { /// qamets yod vav
                            /// The SBL should probably be "āw" (translit mistake?)
                            /// What about Qamets Chatuph?
                            new_word.add_phonetic_unit("ɔu̯", "ɑv", "āyw", {type: "v", len: "long", diphthong: true, secondary_stress: diphthong_obj.meteg});
                            pos += diphthong_obj.skip_amt;
                        } else {
                            console.log("Encountered an unknown dipthong.");
                            found_problem(letter);
                            return false;
                        }
                    } else {
                        /// Is there a final Hey following? Qamets Hey
                        if (orig_word[pos + 1] === "\u05d4" && pos + 2 === len) {
                            if (new_word.hebrew_is_accented(pos + 1)) {
                                ///TODO: Determine if the IPA pronunication should change for stressed final heys
                                new_word.add_phonetic_unit("ɔː", "ɑː", "ā", {type: "v", len: "long"});
                            } else {
                                new_word.add_phonetic_unit("ɔː", "ɑː", "â", {type: "v", len: "long"});
                            }
                        /// Is there a final Hey after a meteg? Qamets Hey + meteg
                        } else if (orig_word[pos + 1] === "\u05bd" && orig_word[pos + 2] === "\u05d4" && pos + 3 === len) {
                            if (new_word.hebrew_is_accented(pos + 2)) {
                                ///TODO: Determine if the IPA pronunication should change for stressed final heys
                                new_word.add_phonetic_unit("ɔː", "ɑː", "ā", {type: "v", len: "long"});
                            } else {
                                new_word.add_phonetic_unit("ɔː", "ɑː", "â", {type: "v", len: "long"});
                            }
                        } else {
                            /**
                            Qamets or Qamets Chatuph (Qamatz Qatan)?
                                When you see a Qamets, you must ask
                                    1) is it in a closed syllable? (i.e., a syllable that ends in a stopping sound or diphthong) and
                                    2) is the syllable unaccented? (most Hebrew words are accented on the last syllable).
                                If both conditions are met, the Qamets is Chatuph and should be pronounced as an "o" sound.
                            */
                            ///NOTE: Metegs can be used to incidate that it is a qamets (\u05bd is a meteg).
                            ///TODO: Consider converting this to a qamats qatan (\u05c7).
                            if (!new_word.hebrew_is_accented(pos, false, true) && !new_word.hebrew_is_accented(pos + 1, false, true) && (
                                pos + 1 < len && /// It must not be at the end of the word
                                orig_word[pos + 1] !== "\u05bd" && /// There must not be a meteg after it
                                /// The next character is the end or it is not a vowel and the consonant is not an Aleph (Quiescent Aleph).
                                ///  /^(?!\u05bd?\u05d5[\u05bc\u05b9])/ looks for holam vav or holam male with a possible meteg in the beginning.
                                ((pos + 2 === len && orig_word[pos + 1] !== "\u05d0") || ((/[^\u05b1-\u05bb]/.test(orig_word[pos + 2]) && orig_word[pos + 1] !== "\u05d0") && (/^(?!\u05bd?\u05d5[\u05bc\u05b9])/.test(orig_word.substr(pos + 2, 3) ) )))
                            )) { /// Qamets Chatuph
                                new_word.add_phonetic_unit("o", "o", "o", {type: "v", len: "short"});
                            } else {
                                new_word.add_phonetic_unit("ɔː", "ɑː", "ā", {type: "v", len: "long"});
                            }
                        }
                    }
                    break;
                case "\u05b7": /// patah
                    if ((diphthong_obj = diphthong())) {
                        if (diphthong_obj.letter === "\u05d9") { /// yod
                            new_word.add_phonetic_unit("ɑi̯", "ɑi̯", "ay", {type: "v", len: "long", diphthong: true, secondary_stress: diphthong_obj.meteg});
                            pos += diphthong_obj.skip_amt;
                        } else if (diphthong_obj.letter === "\u05d9\u05d5") { /// yod + vav
                            ///NOTE: Does the yod alter the pronunciation at all?
                            new_word.add_phonetic_unit("ɑu̯", "ɑv", "aw", {type: "v", len: "long", diphthong: true, secondary_stress: diphthong_obj.meteg});
                            pos += diphthong_obj.skip_amt;
                        } else {
                            console.log("Encountered an unknown dipthong.");
                            found_problem(letter);
                            return false;
                        }
                    } else {
                        /// Is there a lone vav following or a lone vav after a meteg?
                        //console.log(to_unicode(orig_word[pos + 1]));
                        //console.log(to_unicode(orig_word[pos + 2]));
                        //console.log(/^\u05d5(?:[^\u05b0-\u05bc]|$)/.test(orig_word.substr(pos + 1)));
                        //if ((/^\u05d5(?!\u05b0-\u05bc)/.test(orig_word.substr(pos + 1)) && !new_word.hebrew_is_accented(pos + 1)) || (/^\u05bd\u05d5(?!\u05b0-\u05bc)/.test(orig_word.substr(pos + 1)) && !new_word.hebrew_is_accented(pos + 2))) {
                        if ((/^\u05d5(?:[^\u05b0-\u05bc]|$)/.test(orig_word.substr(pos + 1)) && !new_word.hebrew_is_accented(pos + 1)) || (/^\u05bd\u05d5(?:[^\u05b0-\u05bc]|$)/.test(orig_word.substr(pos + 1)) && !new_word.hebrew_is_accented(pos + 2))) {
                            new_word.add_phonetic_unit("ɑ", "ɑ", "ǎ", {type: "v", len: "short"});
                        } else {
                            new_word.add_phonetic_unit("ɑ", "ɑ", "a", {type: "v", len: "short"});
                        }
                    }
                    break;
                case "\u05b5": /// tsere
                    if ((diphthong_obj = diphthong())) {
                        if (diphthong_obj.letter === "\u05d9") { /// tsere yod
                            new_word.add_phonetic_unit("ei̯", "ei̯", "ê", {type: "v", len: "long", diphthong: true, secondary_stress: diphthong_obj.meteg});
                            pos += diphthong_obj.skip_amt;
                        } else if (diphthong_obj.letter === "\u05d9\u05d5") { /// tsere yod vav
                            new_word.add_phonetic_unit("eyu", "ev", "êw", {type: "v", len: "long", diphthong: true, secondary_stress: diphthong_obj.meteg});
                            pos += diphthong_obj.skip_amt;
                        } else {
                            console.log("Encountered an unknown dipthong.");
                            found_problem(letter);
                            return false;
                        }
                    } else {
                        new_word.add_phonetic_unit("e", "e", "ē", {type: "v", len: "long"});
                    }
                    break;
                case "\u05b6": /// segol
                    if ((diphthong_obj = diphthong())) {
                        if (diphthong_obj.letter === "\u05d9") { /// segol yod
                            new_word.add_phonetic_unit("ɛi̯", "e̞i̯", "ê", {type: "v", len: "long", diphthong: true, secondary_stress: diphthong_obj.meteg});
                            pos += diphthong_obj.skip_amt;
                        } else {
                            console.log("Encountered an unknown dipthong.");
                            found_problem(letter);
                            return false;
                        }
                    } else {
                        new_word.add_phonetic_unit("ɛ", "ɛ", "e", {type: "v", len: "short"});
                    }
                    break;
                case "\u05b1": /// hataf segol 
                    new_word.add_phonetic_unit("ɛ̆", "ĕ̞", "ĕ", {type: "v", len: "reduced"});
                    break;
                case "\u05b2": /// chateph patach
                    new_word.add_phonetic_unit("ə̆", "ə̆", "ă", {type: "v", len: "reduced"});
                    break;
                case "\u05b9": /// holam
                case "\u05ba": /// holam hasser for vav
                    /*
                    /// Might not have the [w] apporimate at the end.
                    syllable.add_silient_vowel = true;
                    syllable.add_silient_vowel_after_c = "e";
                    syllable.add_silient_vowel_after_v = "";
                    syllable.reduced = false;
                    add_v("o", "ow", "o");
                    */
                    
                    if ((diphthong_obj = diphthong())) {
                        if (diphthong_obj.letter === "\u05d9") { /// holam yod
                            new_word.add_phonetic_unit("oi̯", "oi̯", "ôy", {type: "v", len: "long", diphthong: true, secondary_stress: diphthong_obj.meteg});
                            pos += diphthong_obj.skip_amt;
                        } else {
                            console.log("Encountered an unknown dipthong.");
                            found_problem(letter);
                            return false;
                        }
                    } else {
                        /// Is it a holam male?
                        /// Other holam male variations? פוֹ, פֹה, צֹא
                        if (orig_word[pos - 1] === "\u05d5" && letter !== "\u05ba") {
                            //if (translit.id == 7575 ) console.log(new_word.last_v_info());
                            if ((new_word.last_type() !== "c" || new_word.last_c_info().syllable_division) && (new_word.last_type() === false || !new_word.last_v_info().diphthong)) {
                                ///NOTE: Perhaps this is not right.
                                new_word.add_phonetic_unit("o", "o̞w", "wō", {type: "v", len: "long"});
                            } else {
                                new_word.add_phonetic_unit("o", "o̞w", "ô", {type: "v", len: "long"});
                            }
                        } else {
                            new_word.add_phonetic_unit("o", "o̞w", "ō", {type: "v", len: "long"});
                        }
                    }
                    break;
                case "\u05c7": /// qamets qatan (Qamets Chatuph)
                    new_word.add_phonetic_unit("o", "o", "o", {type: "v", len: "short"});
                    break;
                case "\u05b3": /// Hataf Qamatz / chateph qamets
                    new_word.add_phonetic_unit("ŏ", "o", "ŏ", {type: "v", len: "reduced"});
                    break;
                case "\u05bb": /// qubuts / qibbuts / Kubutz
                    new_word.add_phonetic_unit("u", "u", "u", {type: "v", len: "short"});
                    break;
                case "\u05b0": /// sheva
                    ///NOTE: Sheva can be a syllable divider (if there is alread a vowel) or a vowel.
                    /// Is is a syllable divider (or last)?
                    /*
                    if (new_word.last_type() === "v" || pos + 1 === len ||
                        /// Or is there a Mater lectionis?
                        (pos + 2 === len && orig_word[pos + 1] === "\u05d0")) {
                    */
                    /// Pronunced shevas must not be last, follow a short vowel,
                    /// (these are not checked for), must not proceed another sheva, or close a syllable.
                    /// It is pronunced if it is at the beinning of a word, the second sheva of two in a row, under a dagesh forte, following a long vowel.
                    ///NOTE: May also need to check to see if two consonants ago has secondary_stress (incase the meteg is placed before the vowel).
                    ///NOTE: Also, it might be silent under a gutteral (hey, het, ayin, and aleph).
                    /// If there are two shevas in a row and the last one is at the end of a word, pronunce the first one. /^.\u05bc?\u05b0^/ tests for this situation.
                    /// What about Shva Ga'ya?
                    if ((pos + 1 !== len) && (new_word.last_v() === false || (new_word.last_c_info(1) && new_word.last_c_info(1).syllable_division) || (new_word.last_type() === "c" && new_word.last_c_info() && new_word.last_c_info().dagesh === "forte") || (new_word.last_type() === "c" && new_word.last_v_info() && new_word.last_v_info().len === "long")) || /^.\u05bc?\u05b0$/.test(orig_word.substr(pos + 1)) ) {
                        new_word.add_phonetic_unit("ɛ̆", "ɛ̆", "ĕ", {type: "v", len: "reduced"});
                    } else {
                        new_word.add_info({syllable_division: true});
                    }
                    break;
                case "\u05b4": /// hireq / chireq
                    /// Is it a hireq-yod?
    
                    if ((diphthong_obj = diphthong())) {
                        if (diphthong_obj.letter === "\u05d9") { /// yod
                            new_word.add_phonetic_unit("ɪi̯", "iː", "î", {type: "v", len: "long", diphthong: true, secondary_stress: diphthong_obj.meteg});
                            pos += diphthong_obj.skip_amt;
                        } else if (diphthong_obj.letter === "\u05d9\u05d5") { /// yod + vav
                            new_word.add_phonetic_unit("ɪu̯", "iu̯", "îw", {type: "v", len: "long", diphthong: true, secondary_stress: diphthong_obj.meteg});
                            pos += diphthong_obj.skip_amt;
                        } else {
                            console.log("Encountered an unknown dipthong.");
                            found_problem(letter);
                            return false;
                        }
                    } else {
                    /*
                    if (orig_word[pos + 1] === "\u05d9" && !new_word.hebrew_is_accented(pos + 1, true)) {
                        new_word.add_phonetic_unit("i", "iː", "î", {type: "v", len: "long"});
                        pos += 1;
                    /// Is it a hireq-yod with a meteg?
                    } else if (orig_word[pos + 1] === "\u05bd" && orig_word[pos + 2] === "\u05d9" && !new_word.hebrew_is_accented(pos + 1, true)) {
                        new_word.add_phonetic_unit("i", "iː", "î", {type: "v", len: "long", secondary_stress: true});
                        pos += 2;
                    } else {
                    */
                        /// What about Reduced Hiriq?
                        new_word.add_phonetic_unit("ɪ", "i", "i", {type: "v", len: "short"});
                    }
                    break;
                /// points
                case "\u05bd": /// Meteg / ga'aya
                    /// Metegs are also used to indicate changes in vowel quality (i.e., "long").
                    new_word.add_info({secondary_stress: true});
                    
                    ///NOTE: It seems like patahs are not supposed to change to long!
                    ///NOTE: Also, some suggest "A Sheva coming after a long unaccented vowel is Nach ('silent') even if that vowel has a Meteg."
                    if (new_word.last_type() === "v" && new_word.last_v_info().letter !== "\u05b7") {
                        new_word.add_info({len: "long"});
                    }
                    break;
                case "\u05bf": /// Rafe
                    new_word.add_info({rafe: true});
                    break;
                case "\u05bc": /// Dagesh
                default:
                    console.log("Encountered an unknown symbol.");
                    found_problem(letter);
                    return false;
                }
                pos += 1;
            }
            
            new_word.remove_silient_aleph();
            
            new_word.shorten_final_dagesh_forte();
            
            ///NOTE: Syllables with diphthongs are considered closed.
            
            /// Is there a patach gnuva / furtive patach (Final het/ayin/he + patah)?
            ///NOTE: The hey should have a mappiq (dagesh like point).
            ///NOTE: Most Hebrew words are generally accented on the last syllable of the word
            ///NOTE: Accent note: When a furtive patach appears under a Chet, Ayin, or dotted Hey, the accent falls on the preceding syllable (e.g., RU-ach, ye-SHU-a). 
            ///NOTE: Currently, it does not switch the letters if there is an accent mark or meteg on the last letter.
            if (((new_word.last_c() && new_word.last_c().match(/[\u05d4\u05d7\u05e2]/)) && new_word.last_type() === "v" && new_word.last_v() === "\u05b7") && !new_word.last_v_info().accented && !new_word.last_v_info().secondary_stress && !new_word.last_v_info().diphthong) {
                new_word.switch_last_two();
            }
            
            new_word.syllablize_hebrew();
        }
        
        /// Are there Hebrew letters in the word?
        if (/[\u0590-\u05FF]/.test(word)) {
            /// Replace sin/shin points with shin/shin combind unicode characters.
            word = word.replace(/\u05e9\u05c1/g, "\ufb2a").replace(/\u05e9\u05c2/g, "\ufb2b");
            /// Remove invisible joining characters.
            //word = word.replace(/\u034f/g, "");
            new_word.lang = "hebrew";
            translit_hebrew();
        } else {
            new_word.lang = "greek";
            translit_greek();
        }
        
        new_word.create_dictionary_forms();
            
        return {ipa: new_word.ipa, ipa_mod: new_word.mod, sbl: new_word.sbl, dic: new_word.dic_biblical, dic_mod: new_word.dic_modern};
    }
    
    return function (word, get_base_form)
    {
        var i,
            len,
            tmp,
            res,
            word_arr;
        
        /// Replace Hebrew Maqaf's (hyphens) with a space.
        word = word.replace(/\u05be/g, " ");
        word_arr = word.split(/\s+/g);
        
        if (word_arr.length < 2) {
            return translit_word(word, get_base_form);
        } else {
            len = word_arr.length;
            
            for (i = 0; i < len; i += 1) {
                if (word_arr[i] !== "") {
                    tmp = translit_word(word_arr[i], get_base_form);
                    if (i === 0) {
                        res = tmp;
                    } else {
                        res.ipa     += " " + tmp.ipa;
                        res.ipa_mod += " " + tmp.ipa_mod;
                        res.sbl     += " " + tmp.sbl;
                        res.dic     += " " + tmp.dic;
                        res.dic_mod += " " + tmp.dic_mod;
                    }
                }
            }
            
            return res;
        }
    };
}());
