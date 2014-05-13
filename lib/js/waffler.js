var how_long = 5.0; //how long for each question, in seconds
var time; //used to hold current time per question
var support = 50; //percent at which to start support graph
var reset_number_of_questions = 10; //total number of questions per game
var number_of_questions; //the holder for number of questions during a game
var interval = 1; //helper variable used by timer
var timer, issue, issue_version, poll,play_page; //various holder variables
var did_they_waffle = []; //used to hold questions the player "waffled" on
var answers = []; //used to hold answers to questions
var keep_track = []; //used to, well, keep track of the play
var issues = []; //used to hold issues
var choices = {},sources = {},positions = {},ydr_source = {}; //used to hold pieces of the issues
var possible_answers = ['Yes','No','No Answer']; //used to show what user chose

//use this if you want to pull directly from a google spreadsheet.
//handy for testing
//var url = 'https://spreadsheets.google.com/feeds/list/0AmZLmP_PGBQKdHJrZjdVM1E5LVRkTGZxNkp3bEZhdHc/od6/public/values?alt=json-in-script&callback=?';

//this is the data. essentially, just what you get if you save the spreadsheet in json format, e.g.:
//https://spreadsheets.google.com/feeds/list/0AmZLmP_PGBQKdHJrZjdVM1E5LVRkTGZxNkp3bEZhdHc/od6/public/values?alt=json
var url = 'lib/js/data.js';

//these are the main (but not all) spreadsheet column names we want
//we specified them because the reporters and editors tended to want to add
//other, superfluous columns to the spreadsheet
//important: column names get transformed by google when converted to JSON,
//specifically spaces and characters like '-' and '/' get stripped out and
//alpha chars are lowercased
//also, it's a good idea to emphasize to editors and reporters that they MUST NOT
//change these column names or the app will break
//also, see the note on "position" in the load_gs_content function for how we find
//candidate positions in the data
var wanted = [
    'issue', //the main issue, e.g., abortion, economy
    'topic', //the more specific topic, e.g.
    'question',
    'yes',
    'no',
    'source',
    'readmore'
];

$(document).ready( function(){
    $('#yesbtn, #nobtn, #seeresults, #missed, #question-number-div, .timercon').hide();
    $.ajax({
       type: 'GET',
        url: url,
        async: false,
        contentType: "application/json",
        //use jsonp if you're pulling directly from a spreadsheet
//        dataType: 'jsonp', 
        dataType: 'json',
        success: function(spreadsheet_data) {
            load_gs_content(spreadsheet_data);
            make_issues();
        }
    });
    for (var i=0; i<100; i++) {
        var node = document.createElement("div");
        node.setAttribute("id", "t" + (100-i));
        node.setAttribute("class", "metertick");
        $("#metercon").append(node);
    }

});

function make_issues() {
    $.each(choices, function(issue,value) {
        issues.push(issue);
    
    });

}

function start() {
    //set number of questions to the reset
    //this will be zero if they play again.
    number_of_questions = reset_number_of_questions;
    interval = 1;
    support = 50;
    $('#startbtn,#seeresults').hide();
    $('#yesbtn,#nobtn,#timer,#question-number-div,.timercon').show();
    build_support(50);
    make_tracker();
    new_question(); 
}

function make_tracker() {
    for(var i in choices) {
        keep_track[i] = [];
        answers[i] = [];
    }
}

function new_question() {
    var is_unique = false;
    number_of_questions--;
    $('#number-of-questions').text(10-number_of_questions);
    time = 5.1;
    if(interval != 1) { clearTimeout(interval); clearTimeout(timer);}
    if(number_of_questions >= 0) {
        $('#timer').text(how_long);
        while(!is_unique) {
//            issue = picker(Object.keys(choices));
            issue = picker(issues);
            issue_version = picker(choices[ issue ].questions);
            if($.inArray(issue_version,keep_track[issue]) != -1) {
                continue;
            }
            else {
                keep_track[issue].push(issue_version);
                poll = choices[issue].poll;
                is_unique = true;
            }
        }
        if(typeof did_they_waffle[issue] == 'undefined') {
            did_they_waffle[issue] = [];
        }
        timer = setInterval(function() {
            if(number_of_questions < 0) {
                document.getElementById('timeleft').innerHTML = 0.0;
                clearTimeout(timer);
                return;
            }
            time = time - 0.1;
            document.getElementById('timeleft').innerHTML = precise_round(time,1);

            if (time <= 0) {
               time = how_long
               document.getElementById('timeleft').innerHTML = precise_round(time,1);
               clearInterval(interval);
            }
        }, 100);
        interval = setTimeout(grader,5000);
        $('#thequest').text(issue_version);
    }
    else {
        clearTimeout(timer);
        $('#timeleft').text('0.0');
        $('#number-of-questions').text(10);
//        var waffle_text = waffle_counter();
        var waffle_text = '';
        var final_support = 'Your support: ' + support + ' percent. ';
        var final = '';
        
        if (support >= 75) {
            final = 'Nate Silver predicts a landslide.';
        }
        else if (support >= 50) {
            final = "You're leading in the polls.";
        }        
        else if (support >= 35) {
            final = "You're a bit of an underdog.";
        }
        else {
            final = "You may be unelectable.";
        }        
        $('#thequest').text(final_support + final + waffle_text);
        $('#startbtn').text("TRY AGAIN");
        $('#startbtn').show();
        $('#seeresults').show();
        $('#yesbtn').hide();
        $('#nobtn').hide();
    }
}
function waffle_counter(issue) {
    var how_many = issue.length;
    if(how_many <=1) { return false; } // can't waffle if only one question
    var previous_choice = issue[0][1];
    for(var i = 1; i < how_many; i++) {
        if(issue[i][1] != previous_choice) { return true; } //they waffled    
    
    }
    return false;
}

function grader(pick) {
    if(typeof pick === 'undefined') { //they didn't pick something before time ran out
        support -= 5;
        $('#missed').show();
        answers[issue].push([issue_version,2])
    }
    else {
        $('#missed').hide();
        //track their answers to see if they waffled
        if($.inArray(did_they_waffle[issue],pick === -1)) { 
            did_they_waffle[issue].push(pick);
        }
        answers[issue].push([issue_version,pick]);
        //our completely unscientific way of deciding how many points to add/subtract based on poll results
        //we only use yes/no results. "formula" is 
        //(percent in poll answer user chose - the percent in alternative) / 10)
        if(pick === 0) { var alternative = 1; }
        else { alt = 0; }
        change = Math.floor((poll[pick] - poll[alt])/10);
        support += change;
    }
    //because, really, you can't go above or below these numbers in % support
    if(support > 100) { support = 100; }
    if (support < 0) { support = 0; }
    build_support(support);
    new_question();
    
}
//makes the support graph
function build_support(support) {
    //for everything up to the percent support
    //paing the tick green
    for (var i=0; i<=support; i++) {
        var id = 't' + i;
        $('#' + id).addClass('tickhigh');
    }
    //everything above that is gray
    for (var i=support+1; i<=100; i++) {
        var id = 't' + i;
        $('#' + id).removeClass('tickhigh');
    }
}
//makes the ticker
function clock_ticker() {
    time -= 0.1;
    time = precise_round(time,1);
    if(time <= 0.0) { time = 0.0; }
    $('#timeleft').text(time);

}
//does what is says: shows results page
function show_results() {
    var results_page = '';
    var count = 0;
    play_page = $('#container').html(); //store the last question page so we can return
    $('#container').hide('fast');
    var source = $("#results-topper").html();
    var template = Handlebars.compile(source);
    results_page += template();

    var source = $("#waffle-icon").html();
    var template = Handlebars.compile(source);
    var waffler = template({});
//this could really be cleaned up, but, well, we're too lazy
//this builds the table that shows the user's choices and the candidates'.
    for(var issue in answers) {
        if(answers[issue].length === 0) { continue; }
        var source_link = sources[issue];
        //show the waffle if they did
        if (waffle_counter(answers[issue])) {
            var waffle = waffler;
        }
        else {
            var waffle = '';
        }
        //note that this is hardcoded for six candidates
        //you should either rework this to do it dynamically or
        //change this to match yours
        if(count === 0) {
            var your_stance = 'Your stance';
            var cand1_stance = 'Candidate 1 stance';
            var cand2_stance = 'Candidate 2 stance';
            var cand3_stance = 'Candidate 3 stance';
            var cand1_stance = 'Candidate 4 stance';
            var cand2_stance = 'Candidate 5 stance';
            var cand3_stance = 'Candidate 6 stance';
            count++;
        }
        else {
            your_stance = cand1_stance = cand2_stance = cand3_stance = cand4_stance = cand5_stance = cand6_stance = cand7_stance = '';
        
        }
        var your_stance = your_stance = cand1_stance = cand2_stance = cand3_stance = cand4_stance = cand5_stance = cand6_stance = cand7_stance = '';
        var source = $("#results-header").html();
        var template = Handlebars.compile(source);
        results_page += template({the_issue: issue,waffle: waffle});
        var source = $("#results-poll").html();
        var template = Handlebars.compile(source);
        results_page += template({yes: choices[issue].poll[0],no: choices[issue].poll[1],source_link: source_link});
        var how_many = answers[issue].length;
        for(var i = 0; i < how_many; i++) {
            var source = $("#results-detail").html();
            var template = Handlebars.compile(source);
            var player_answer = possible_answers[ answers[issue][i][1] ];
            var cand1_answer = make_position(issue,'candidate1');
            var cand2_answer = make_position(issue,'candidate2');
            var cand3_answer = make_position(issue,'candidate3');
            var cand4_answer = make_position(issue,'candidate4'); 
            var cand5_answer = make_position(issue,'candidate5');
            var cand6_answer = make_position(issue,'candidate6');
            results_page += template({
                question_version: answers[issue][i][0],player_answer: player_answer,cand1_answer:cand1_answer,
                cand2_answer:cand2_answer,cand3_answer:cand3_answer,cand4_answer:cand4_answer,cand5_answer:cand5_answer,
                cand6_answer:cand6_answer
            });
        }
    }
    var source = $("#results-footer").html();
    var template = Handlebars.compile(source);
    results_page += template({});
    var source = $("#back-button").html();
    var template = Handlebars.compile(source);
    results_page += template({});
    $('#container').removeClass('container-crowd');
    $('#container').html(results_page).show('fast');
}
//This formats the candidate's position
//based on the source: york story if it's from
//york's poll or a link if an external source
function make_position(issue,key) {
    var position = positions[issue][candidate_key[key] ];
    var ydr_position = ydr_source[issue];
    var source_key = candidates[ candidate_key[key]].key;
    var source = positions[issue][source_key];
    if(source.match(/http/)) {
        return '<a href="' + source + '" target="_blank" title="See source">' + position + '</a>';
    }
    else {
        return '<a href="' + ydr_position + '" target="_blank" title="See source">' + position + '</a>';
    }

}
//takes us back to replay
function replay() {
    $('#container').hide('fast').addClass('container-crowd').html(play_page).show('fast');
  

}
function picker(choices) { //choices is the array to pick from
    var max = choices.length-1; //the max value is the length of the array - 1 because of zero indexing
    var random = Math.floor(Math.random() * (max - 0 + 1)) + 0; //random value calc to pick an integer
    return choices[random]; //use that interger to pick one of the array elements
}
var load_gs_content = function(spreadsheet_data) {
    var data = [];
    //this parses our spreadsheet data and puts the various pieces in their proper array and object holders
	var keyPattern = /gsx/;
	for(i in spreadsheet_data.feed.entry) {
		var row = {};
		for(j in spreadsheet_data.feed.entry[i]) {
			if(keyPattern.test(j)) {
				var key = j.replace('gsx$','');//get rid of the crap google puts in front of column names
                if(wanted.indexOf(key) != -1 || candidates[key] || key.match(/position/)) {
                    //this formats issues and topics as a key we use to store questions and poll results that are about the same topic
                    //so each 'issue: topic' will have an object that has:
                    //poll: array of results for yes, no
                    //questions: an array of question versions on that topic
                    //we also use it to build an objects on the candidates' positions on these topics, sources and links to stories
                    if(key == 'issue') {
                        var full_issue = spreadsheet_data.feed.entry[i][j].$t.trim();
                    }
                    else if(key == 'topic') {
                        full_issue += ': ' + spreadsheet_data.feed.entry[i][j].$t.trim();
                        if(!choices[full_issue]) {
                            choices[full_issue] = {poll: [1,2], questions: new Array()};
                            positions[full_issue] = {};
                        }
                    }
                    else {
                    //populate poll results, question versions, candidate positions, poll sources and links to stories
                        if(key === 'yes') {
                            choices[full_issue].poll[0] = spreadsheet_data.feed.entry[i][j].$t.trim();
                        }
                        if(key === 'no') {
                            choices[full_issue].poll[1] = spreadsheet_data.feed.entry[i][j].$t.trim();
                        }
                        if(key === 'question') {
                            choices[full_issue].questions.push(spreadsheet_data.feed.entry[i][j].$t.trim());
                        }
                        if(key === 'source') {
                            sources[full_issue] = spreadsheet_data.feed.entry[i][j].$t.trim();
                        }
                        //here's where we determine this is a candidate's position on a topic
                        //we use the "key" variable from the candidates object with is in lib/js/candidates_pa
                        //also the column heading should have the word "position"
                        if(candidates[key] || key.match(/position/)) {
                            positions[full_issue][key] = spreadsheet_data.feed.entry[i][j].$t.trim();
                        }
                        if(key === 'readmore') {
                            ydr_source[full_issue] = spreadsheet_data.feed.entry[i][j].$t.trim();
                        }
                        
                    }
                }
			}
			
		}
	}
}
//give us proper round tenths-place decimal for the timer
function precise_round(num,decimals){
    return Math.round(num*Math.pow(10,decimals))/Math.pow(10,decimals);
}