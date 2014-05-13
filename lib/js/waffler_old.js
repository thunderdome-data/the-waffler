var how_long = 5.0;
var support = 50;
var number_of_questions = 10;
var interval = 1;
var time = parseFloat(5.0);
var timer, issue, issue_version, poll,play_page;
var did_they_waffle = [];
var answers = [];
var keep_track = [];
var issues = [];
$(document).ready( function(){
    $('#yesbtn').hide();
    $('#nobtn').hide();
    $('#seeresults').hide();
    $('#missed').hide();
    $('#question-number-div').hide();
    make_issues();
    console.log(issues);
    
$(function() {
    $( "#dialog-message" ).dialog({
      modal: true,
      minWidth: 600,
      buttons: [{
        text: "Let's play!", click: function() {
          $( this ).dialog( "close" );
        }
      }]
    });
  });

});
function make_issues() {
    $.each(choices, function(issue,value) {
        issues.push(issue);
    
    });

}

function start() {
    number_of_questions = 10;
    interval = 1;
    support = 50;
    $('#startbtn').hide();
    $('#seeresults').hide();
    $('#yesbtn').show();
    $('#nobtn').show();
    $('#timer').show();
    $('#question-number-div').show();
    build_support(50);
    make_tracker();
    new_question(); //
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
        $('#timer').text('5.0');
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
/*
function waffle_counter() {
    var waffle_count = 0
    for(i in did_they_waffle) {
        if (did_they_waffle[i].length > 1) {
            waffle_count++;
        }
    }
    return ' You waffled on ' + waffle_count + ' issues. ';
}
*/
function grader(pick) {
    if(typeof pick == 'undefined') {
        support -= 5;
        $('#missed').show();    
    }
    else {
        $('#missed').hide();
        if($.inArray(did_they_waffle[issue],pick == -1)) {
            did_they_waffle[issue].push(pick);
        }
        answers[issue].push([issue_version,pick]);
        if(pick == 0) { var alt = 1; }
        else { alt = 0; }
        change = Math.floor((poll[pick] - poll[alt])/10);
        support += change;
            //need to keep track of
            //issues
            //version of question
            //your choices for that verison
            //last answer for this issue
            //waffles on this issue
    }
    if(support > 100) { support = 100; }
    if (support < 0) { support = 0; }
    build_support(support);
    new_question();
    
}

function build_support(support) {
    for (var i=0; i<=support; i++) {
        var id = 't' + i;
        $('#' + id).addClass('tickhigh');
    }
    for (var i=support+1; i<=100; i++) {
        var id = 't' + i;
        $('#' + id).removeClass('tickhigh');
    }
}

function clock_ticker() {
    time -= 0.1;
    time = precise_round(time,1);
    if(time <= 0.0) { time = 0.0; }
    $('#timeleft').text(time);

}

function show_results() {
    var results_page = '';
    var count = 0;
    var possible_answers = ['Yes','No'];
    play_page = $('#container').html();
    $('#container').hide('fast');
    var source = $("#results-topper").html();
    var template = Handlebars.compile(source);
    results_page += template();

    var source = $("#waffle-icon").html();
    var template = Handlebars.compile(source);
    var waffler = template({});

    for(var issue in answers) {
        if(answers[issue].length == 0) { continue; }
        var source_link = sources[issue];
        if (waffle_counter(answers[issue])) {
            var waffle = waffler;
        }
        else {
            var waffle = '';
        }
        if(count == 0) {
            var your_stance = 'Your stance';
            var cand1_stance = 'Candidate 1 stance';
            var cand2_stance = 'Candidate 2 stance';
//            var cand3_stance = 'Candidate 3 stance';
            count++;
        }
        else {
            your_stance = cand1_stance = cand2_stance = cand3_stance = '';
        
        }
        var your_stance = cand1_stance = cand2_stance = cand3_stance = '';
        var source = $("#results-header").html();
        var template = Handlebars.compile(source);
        results_page += template({the_issue: issue,your_stance: your_stance, cand1_stance: cand1_stance,cand2_stance:cand2_stance,waffle: waffle});
        var source = $("#results-poll").html();
        var template = Handlebars.compile(source);
        results_page += template({yes: choices[issue].poll[0],no: choices[issue].poll[1],source_link: source_link});
        
        var how_many = answers[issue].length;
        for(var i = 0; i < how_many; i++) {
            var source = $("#results-detail").html();
            var template = Handlebars.compile(source);
            var player_answer = possible_answers[ answers[issue][i][1] ];
            var cand1_answer = picker(possible_answers); //randomly pick the candidate's answer
            var cand2_answer = picker(possible_answers);
            var cand3_answer = picker(possible_answers);
            results_page += template({question_version: answers[issue][i][0],player_answer: player_answer,cand1_answer:cand1_answer,cand2_answer:cand2_answer,cand3_answer:cand3_answer});
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

function replay() {
    $('#container').hide('fast').addClass('container-crowd').html(play_page).show('fast');
  

}
function picker(choices) { //min is the minimum integer to choose, choices is the array to pick from
    var max = choices.length-1; //the max value is the length of the array - 1 because of zero indexing
    var random = Math.floor(Math.random() * (max - 0 + 1)) + 0; //random value calc to pick an integer
    return choices[random]; //use that interger to pick one of the array elements
}
function precise_round(num,decimals){
    return Math.round(num*Math.pow(10,decimals))/Math.pow(10,decimals);
}