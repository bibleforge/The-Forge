"use strict";

this.segment_init = function (analysis, dict, trad)
{
    return (function ()
    {
        var get_significance;
        
        /// Is this in a browser environment?
        if (typeof window === "undefined" && typeof exports === "object") {
            analysis = require(analysis).analysis;
            dict = require("fs").readFileSync(dict, "utf8");
        }
        
        get_significance = (function ()
        {
            var p;
            
            if (trad) {
                /// Created in the Forge on Wed, 17 Apr 2013 10:29:45 GMT.
                /// Traditional Chinese Plot Data
                p = [{x:0,y:8119},{x:66,y:1084},{x:140,y:735},{x:334,y:426},{x:987,y:193},{x:3013,y:72},{x:8226,y:23},{x:51140,y:1}];
            } else {
                /// Created in the Forge on Wed, 17 Apr 2013 03:46:37 GMT.
                /// Simplified Chinese Plot Data
                p = [{x:0,y:8119},{x:69,y:1084},{x:146,y:735},{x:340,y:426},{x:962,y:202},{x:3103,y:72},{x:8464,y:23},{x:52846,y:1}];
            }
            
            return function get_significance(x)
            {
                var i;
                
                /// Find which p element to use.
                for (i = p.length - 2; i > 0; i -= 1) {
                    if (x >= p[i].x) {
                        break;
                    }
                }
                
                if (typeof p[i].a === "undefined") {
                    p[i].a = Math.pow((p[i + 1].y / p[i].y), (1 / ((p[i + 1].x - p[i].x))));
                    p[i].yint = p[i].y / (Math.pow(p[i].a, p[i].x));
                }
                
                return p[i].yint * Math.pow(p[i].a, x);
            };
        }());
        
        function copy(mixed)
        {
            return JSON.parse(JSON.stringify(mixed));
        }
        
        function get_probabilities(str)
        {
            var i,
                len = str.length,
                prob,
                probs = [];
            
            for (i = 0; i < len; i += 1) {
                prob = analysis[str[i]];
                if (!prob) {
                    /// If the character is unknown, just assign it a simple probablity.
                    prob = {L: 50, M: 1, R: 50, guess: true};
                }
                
                /// Expand short hand.
                if (prob.R === 1 && typeof prob.L === "undefined") {
                    prob.R = 100;
                } else if (prob.L === 1 && typeof prob.R === "undefined") {
                    prob.L = 100;
                }
                
                probs[probs.length] = prob;
            }
            
            return probs;
            ///NOTE: Mozilla has a non-standard .contains() function that could be faster.
        }
        
        function isolate_chinese_characters(str)
        {
            ///NOTE: This removes include punctuation too (\u3000-\u3020\u2014-\u2027\u4e36\ufe4f-\uffe5)
            return {
                /// Divide the string at non-Chinese parts.
                cn:  str.split(/[^\u4e00-\u4e35\u4e37-\u9fff\u3400-\u4dff]+/),
                /// Get an array of the non-Chinese parts to fill in later.
                ///NOTE: If there are no matches, return an empty array so that it has a valid length.
                non: str.match(/[^\u4e00-\u4e35\u4e37-\u9fff\u3400-\u4dff]+/g) || []
            };
        }
        
        function calculate_prob(str, prob, starting, len, include_outer)
        {
            var proceed = true,
                i,
                sample_count = len,
                total_prob = 0,
                valid = true;
            
            ///NOTE: This needs to be inside of this function so that it can set the valid variable.
            function validate_prob(this_prob)
            {
                if (isNaN(this_prob)) {
                    valid = false;
                    this_prob = 0;
                }
                return this_prob;
            }
            
            for (i = starting; i < len + starting; i += 1) {
                if (i === starting) {
                    total_prob += validate_prob(prob[i].L); /// Left
                    /// Since the left is invalid, all future words will be invalid too.
                    if (isNaN(prob[i].L)) {
                        proceed = false;
                    }
                } else if (i === len - 1) {
                    total_prob += validate_prob(prob[i].R); /// Right
                } else {
                    total_prob += validate_prob(prob[i].M); /// Middle
                    /// Since the middle is invalid, all future words will be invalid too.
                    if (isNaN(prob[i].M)) {
                        proceed = false;
                    }
                }
            }
            
            if (include_outer) {
                if (starting < 0) {
                    sample_count += 1;
                    total_prob += validate_prob(prob[starting - 1].R);
                }
                if (len + starting < str.length - 1) {
                    sample_count += 1;
                    total_prob += validate_prob(prob[starting + len].L);
                }
            }
            
            return {valid: valid, prob: Math.round(total_prob / sample_count), proceed: proceed};
        }
        
        function calculate_prob(str, prob, starting, len)
        {
            var i,
                /// Assuming at least a two letter word.
                sample_count = 2,
                tmp_prob,
                total_prob = 0,
                word_prob = {
                    inner_valid:  true,
                    outter_valid: true,
                    middle_valid: true
                };
            
            tmp_prob = prob[starting].L; /// Left
            if (isNaN(tmp_prob)) {
                word_prob.inner_valid = false;
            }
            total_prob += tmp_prob || 0;
            
            tmp_prob = prob[starting + len - 1].R; /// Right
            if (isNaN(tmp_prob)) {
                word_prob.inner_valid = false;
            }
            total_prob += tmp_prob || 0;
            
            word_prob.inner = total_prob / sample_count;
            
            if (starting > 0) {
                tmp_prob = prob[starting - 1].R; /// The previous character's Right
                if (isNaN(tmp_prob)) {
                    word_prob.outter_valid = false;
                }
                total_prob += tmp_prob || 0;
                sample_count += 1;
            }
            if (len + starting < str.length - 1) {
                tmp_prob = prob[starting + len].L; /// The next character's Left
                if (isNaN(tmp_prob)) {
                    word_prob.outter_valid = false;
                }
                total_prob += tmp_prob || 0;
                sample_count += 1;
            }
            
            word_prob.outter = total_prob / sample_count;
            
            word_prob.ave_prob = (word_prob.inner + word_prob.outter) / 2;
            
            ///TODO: chech middle for validity.
            
            for (i = starting + 1; i < len + starting - 1; i += 1) {
                if (isNaN(prob[i].M)) {
                    word_prob.middle_valid = false;
                    break;
                }
            }
            
            word_prob.invalid_count = 0;
            if (!word_prob.inner_valid) {
                word_prob.invalid_count += 1;
            }
            if (!word_prob.outter_valid) {
                word_prob.invalid_count += 1;
            }
            if (!word_prob.middle_valid) {
                word_prob.invalid_count += 1;
            }
            
            return word_prob;
        }
        
        function extract_word(str, prob, starting, len)
        {
            var dict_pos,
                word = {str: str.substr(starting, len)};
            
            if ((dict_pos = dict.indexOf("\n" + word.str + "\n")) > -1) {
                word.in_dict = true;
                word.dict_pos = dict_pos;
            /// Check to see if the last character is very commonly found at the end (like 的 and 了).
            ///TODO: Measure words after a number.
            } else if (word.str.length > 2 && /[了子的儿着吗者呢啊得个过地兒著嗎個過]/.test(word.str.slice(-1)) && (dict_pos = dict.indexOf("\n" + word.str.slice(0, -1) + "\n")) > -1) {
                word.in_dict = true;
                word.dict_pos = dict_pos;
                /// Indicate that one character is not actually in the dictionary.
                word.not_in_dict = 1;
            /// Check for two character endings, like 的人 and 了吗.
            } else if (word.str.length > 3 && /(?:的人|了(?:吗|嗎))/.test(word.str.slice(-2)) && (dict_pos = dict.indexOf("\n" + word.str.slice(0, -2) + "\n")) > -1) {
                word.in_dict = true;
                word.dict_pos = dict_pos;
                /// Indicate that two characters are not actually in the dictionary.
                word.not_in_dict = 2;
            /// Check for short separable words: 吃了饭
            } else if (word.str.length === 3 && /[了着过著過]/.test(word.str.substr(1, 1)) && (dict_pos = dict.indexOf("\n" + word.str.substr(0, 1) + word.str.slice(-1) + "\n")) > -1) {
                word.in_dict = true;
                word.dict_pos = dict_pos;
                /// Indicate that one character is not actually in the dictionary.
                word.not_in_dict = 1;
                word.separable = true;
            }
            /// Misc matching that could be added:
            ///     在……
            ///NOTE: Also match duplication, like 刚刚、高高兴兴.
            
            word.prob = calculate_prob(str, prob, starting, len);
            
            return word;
        }
        
        function examine_str(str, prob, starting)
        {
            var dictionary_max_len = 5,
                i,
                len = str.length - starting,
                word,
                likely_words   = [],
                possible_words = [];
            
            if (len > dictionary_max_len) {
                len = dictionary_max_len;
            }
            
            for (i = 2; i <= len; i += 1) {
                word = extract_word(str, prob, starting, i);
                ///TODO: There should be a way to override this.
                if (word.in_dict || word.prob.invalid_count === 0 || (word.prob.invalid_count === 1 && !word.prob.middle_valid)) {
                    possible_words[possible_words.length] = word;
                }
                
                ///TODO: Make a way to override this.
                if (!word.in_dict && (word.prob.invalid_count > 1 || (word.prob.invalid_count === 1 && !word.prob.middle_valid))) {
                    break;
                }
            }
            
            possible_words.forEach(function (word)
            {
                /// The acceptable probability should probably be changeable.
                if (word.in_dict || word.prob.ave_prob > 60) {
                    likely_words[likely_words.length] = word;
                }
            });
            
            return likely_words;
        }
        
        function find_known_and_likely_words(str, prob)
        {
            var branch,
                branches = [],
                i,
                len = str.length;
            
            /// Subtract one because we want to examine at least 2 characters.
            for (i = 0; i < len - 1; i += 1) {
                branch = examine_str(str, prob, i);
                branches[i] = branch;
            }
            
            return branches;
        }
        
        function create_char_arr(branches)
        {
            var char_arr = [];
            
            branches.forEach(function (branch, x)
            {
                branch.forEach(function (word_obj)
                {
                    var i;
                    
                    for (i = word_obj.str.length - 1; i >= 0; i -= 1) {
                        if (!char_arr[x + i]) {
                            char_arr[x + i] = [];
                        }
                        char_arr[x + i].push({
                            x: x + i,
                            origin_x: x,
                            obj: word_obj,
                            is_beginning: i === 0,
                            is_end: i === word_obj.str.length - 1,
                            total_len: word_obj.str.length,
                            len_left: word_obj.str.length - 1 - i,
                        });
                    }
                });
            });
            
            return char_arr;
        }
        
        function mark_resolved_branches(char_arr, branches, str, prob)
        {
            var currently_disputed,
                disputed_count = -1,
                resolved_branch = [];
            
            function at_ending(arr)
            {
                var i;
                
                for (i = arr.length - 1; i >= 0; i -= 1) {
                    if (!arr[i].is_end) {
                        return false;
                    }
                }
                
                return true;
            }
            
            function tag_disputed(arr, disputed_count)
            {
                arr.forEach(function (el)
                {
                    el.obj.disputed_group = disputed_count;
                });
            }
            
            char_arr.forEach(function (arr)
            {
                /// If there is more than one word, it is disputed.
                if (arr.length > 1) {
                    /// If it's not already known to be disputed, inc group to keep track of the groups.
                    if (!currently_disputed) {
                        disputed_count += 1;
                    }
                    currently_disputed = true;
                /// If it is not disputed and we are at the end, it's resolved!
                } else if (!currently_disputed && arr[0].is_end) {
                    resolved_branch[arr[0].origin_x] = arr[0].obj;
                    arr[0].obj.resolved = true;
                }
                
                /// Tag them all each time just to make sure no one is missed.
                if (currently_disputed) {
                    tag_disputed(arr, disputed_count);
                }
                
                /// If they are all ending, it's the end of a group.
                if (currently_disputed && at_ending(arr)) {
                    currently_disputed = false;
                }
            });
            
            return disputed_count;
        }
        
        function walk_branches(branch_holder, branches, disputed_group, branch_num_obj, x, mark_callback)
        {
            var at_end_of_branch = true,
                i,
                stop_before = branches.length;
                
            function create_mark_func(obj, callback)
            {
                return function (branch_num)
                {
                    /// Create new branch object to track branches.
                    if (!obj.branch) {
                        obj.branch = {};
                    }
                    
                    obj.branch[branch_num] = 1;
                    
                    /// Add this branch if it's not already known.
                    if (!branch_holder[branch_num]) {
                        branch_holder[branch_num] = [];
                    }
                    /// Add this word to the branch tracker.
                    branch_holder[branch_num].push(obj);
                    
                    if (callback) {
                        /// Loop back through the whole tree.
                        callback(branch_num);
                    }
                };
            }
                    
            for (; x < stop_before; x += 1) {
                /// Are there any words in this column?
                if (branches[x] && branches[x].length > 0) {
                    /// Just look for the specific group.
                    if (branches[x][0].resolved || branches[x][0].disputed_group < disputed_group) {
                        continue;
                    }
                    if (branches[x][0].disputed_group > disputed_group) {
                        break;
                    }
                    
                    /// Could make it reverse later; just doing it more straighforwardly at first to make it easier to understand.
                    for (i = 0; i < branches[x].length; i += 1) {
                        /// stop_before needs to keep moving in based on the shortest distance from start to finish.
                        if (x + branches[x][i].str.length < stop_before) {
                            stop_before = x + branches[x][i].str.length;
                        }
                        
                        /// Walk to the next step.
                        walk_branches(branch_holder, branches, disputed_group, branch_num_obj, x + branches[x][i].str.length, create_mark_func(branches[x][i], mark_callback));
                        
                        /// If it found another route, it's not at a branches end, so it does not need to marked the branches at the end.
                        at_end_of_branch = false;
                    }
                }
            }
            
            /// Trigger the mark cascade, if any.
            if (at_end_of_branch && mark_callback) {
                mark_callback(branch_num_obj.num);
                branch_num_obj.num += 1;
            }
        }
        
        function is_more_likely(sig1, sig2, prob1, prob2)
        {
            var i,
                index,
                sig_t1,
                sig_t2,
                calc_sig;
            
            function sum(a, b)
            {
                return a + b;
            }
            
            /// Remove words that are the same so that it doesn't overshadow the average of the significance.
            for (i = sig1.length; i >= 0; i -= 1) {
                index = sig2.indexOf(sig1[i]);
                if (index > -1) {
                    sig1.splice(i, 1);
                    sig2.splice(index, 1);
                }
            }
            
            if (sig1.length > 0) {
                sig_t1 = sig1.map(get_significance).reduce(sum);
            } else {
                sig_t1 = 0;
            }
            if (sig2.length > 0) {
                sig_t2 = sig2.map(get_significance).reduce(sum);
                calc_sig = sig_t1 / sig_t2;
            } else {
                sig_t2 = 0;
                calc_sig = 0;
            }
            
            //console.log(sig1, sig2);
            //console.log(calc_sig, sig_t1,  sig_t2, prob1 / prob2);
            //console.log((calc_sig * 2 + (prob1 / prob2)) / 3,"=", "(",calc_sig * 2,"+","(",prob1,"/",prob2,")) / 3");
            
            if (prob2 > 0) {
                ///NOTE: Weigh signficance a little more since it seems more relaible.
                calc_sig = (calc_sig * 2 + (prob1 / prob2)) / 3;
            }
            
            return calc_sig > 1;
        }
        
        function keep_best_branch(branches_lined_up, branches, disputed_group)
        {
            var best_branch = 0,
                best_words_in_dict = 0,
                best_prob = 0,
                best_sig = [],
                i,
                j,
                clear_branch;
            
            branches_lined_up.forEach(function (lined_up_branch, branch_num)
            {
                var significance,
                    this_words_in_dict = 0,
                    this_prob_tmp = 0,
                    this_prob,
                    this_sig = [];
                
                lined_up_branch.forEach(function(word)
                {
                    if (word.in_dict) {
                        ///NOTE: If some parts of the word are not actually in the dictionary, weight them a little less.
                        this_words_in_dict += word.str.length - (word.not_in_dict ? word.not_in_dict / 1.5 : 0);
                        this_sig[this_sig.length] = word.dict_pos;
                    }
                    this_prob_tmp += word.prob.ave_prob;
                });
                
                this_prob = this_prob_tmp / lined_up_branch.length;
                
                /*
                /// ********************* debugging delete
                if (branch_num > 0 && this_words_in_dict === best_words_in_dict) {
                    var a = "", b = "";
                    lined_up_branch.forEach(function(word){a += " " + word.str});
                    branches_lined_up[best_branch].forEach(function(word){b += " " + word.str});
                    console.log(a.trim() + " vs" + b);
                }
                /// *********************
                */
                
                ///NOTE: Since the arrays are mutated, just send a copy.
                if (branch_num === 0 || this_words_in_dict > best_words_in_dict || (this_words_in_dict === best_words_in_dict && is_more_likely(copy(this_sig), copy(best_sig), this_prob, best_prob))) {
                    best_branch = branch_num;
                    best_words_in_dict = this_words_in_dict;
                    best_prob = this_prob;
                    best_sig = this_sig;
                }
            });
            
            /// Now, remove the others.
            for (i = 0; i < branches.length; i += 1) {
                for (j = branches[i].length - 1; j >= 0; j -= 1) {
                    clear_branch = false;
                    /// If it reached a later branch, we are done.
                    if (branches[i][j].disputed_group > disputed_group) {
                        return;
                    }
                    /// Skip if it is not the right branch.
                    ///NOTE: If it finds a resolved branch after already finding the disputed branch, it could return there too.
                    if (branches[i][j].resolved || branches[i][j].disputed_group < disputed_group) {
                        break;
                    }
                    
                    if (branches[i][j].branch[best_branch]) {
                        branches[i] = [branches[i][j]];
                        /// Break since there's only one per column.
                        break;
                    } else {
                        clear_branch = true;
                    }
                }
                if (clear_branch) {
                    ///NOTE: Deleting just sets the element to undefined, so it's fastest just to replace it all.
                    branches[i] = [];
                }
            }
        }
        
        function resolve_multiple_branches(branches)
        {
            /// First, adding known good branches (single branches) to a resolved variable
            /// while adding unresolved branches to an array of unresolved branches.
            /// Then, recursively loop through all of the branches in the array and total up
            /// how many known characters were found and the overall probablity.
            var branches_lined_up = [],
                disputed_count,
                i;
            
            disputed_count = mark_resolved_branches(create_char_arr(branches));
            
            for (i = 0; i <= disputed_count; i += 1) {
                branches_lined_up[i] = [];
                walk_branches(branches_lined_up[i], branches, i, {num: 0}, 0);
            }
            for (i = 0; i <= disputed_count; i += 1) {
                keep_best_branch(branches_lined_up[i], branches, i);
            }
        }
        
        function format_nicely(branches, str)
        {
            var res = [],
                x = 0;
            
            for (;;) {
                if (x >= str.length) {
                    break;
                }
                
                /// If there are no words, use a single character.
                if (!branches[x] || branches[x].length === 0) {
                    res[res.length] = str.substr(x, 1);
                    x += 1;
                } else {
                    /// Use a word if present.
                    res[res.length] = branches[x][0].str;
                    x += branches[x][0].str.length
                }
            }
            
            return res;
        }
        
        return function segment(orig_str)
        {
            var chunks = isolate_chinese_characters(orig_str),
                res = [];
            
            chunks.cn.forEach(function (str, i)
            {
                var branches,
                    prob = get_probabilities(str);
                
                if (str !== "") {
                    /// Step 1
                    branches = find_known_and_likely_words(str, prob);
                    
                    /// Step 2
                    resolve_multiple_branches(branches);
                    
                    /// Step 3
                    res[res.length] = format_nicely(branches, str);
                }
                
                /// Fill in with any non-Chinese parts.
                if (chunks.non.length > i) {
                    res[res.length] = chunks.non[i];
                }
            });
            
            return res;
        };
    }());
};
