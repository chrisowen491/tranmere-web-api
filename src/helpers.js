const cheerio = require('cheerio');
const { v4: uuidv4 } = require('uuid');

function extractExtraFromHTML (html, date, competition, season, match) {
  const $ = cheerio.load(html);

  const homeTeam = $('span.teamA').text().trim().replace(/\s\d+/, '');
  const homeScore = $('span.teamA em').text().trim().replace(/\s\d+/, '');
  const awayTeam = $('span.teamB').text().trim().replace(/\d+\s/, '');
  const awayScore = $('span.teamB em').text().trim().replace(/\s\d+/, '');

  match.home = homeTeam == "Tranmere" ? "Tranmere Rovers" : homeTeam;
  match.visitor = awayTeam == "Tranmere" ? "Tranmere Rovers" : awayTeam;
  match.opposition = awayTeam == "Tranmere" ? homeTeam : awayTeam;

  match.home = translateTeamName(match.home);
  match.visitor = translateTeamName(match.visitor);
  match.opposition = translateTeamName(match.opposition);

  match.venue = homeTeam == "Tranmere" ? "Prenton Park" : "Unknown";
  match.static = "static";
  match.season = season;
  match.hgoal = homeScore;
  match.vgoal = awayScore;
  match.ft = homeScore + '-' +awayScore

  return match;
}

function getYear() {
    var theDate = new Date();
    if(theDate.getUTCMonth() > 6) {
        return theDate.getFullYear();
    } else {
        return theDate.getFullYear() -1;
    }
}

function extractSquadFromHTML (html, date, competition, season) {
  const $ = cheerio.load(html);

  const homeTeam = $('span.teamA').text().trim().replace(/\s\d+/, '');
  const awayTeam = $('span.teamB').text().trim().replace(/\d+\s/, '');

  const scorersItems = awayTeam == "Tranmere" ? $('div.goalscorers div.teamB span') : $('div.goalscorers div.teamA span');

  const rows = awayTeam == "Tranmere" ? $('.teamB tr') : $('.teamA tr');
  var goals = [];
  scorersItems.each((i, el) => {
    var minRegex = /[\w\s-]+/g;
    var timeRegex = /\d+/g;
    var text = $(el).text();
    var minute = text.match(timeRegex);

    for(var i=0; i < minute.length; i ++) {
        var goal = {
            id: uuidv4(),
            Date: date,
            Opposition: awayTeam == "Tranmere" ? homeTeam : awayTeam,
            Competition:  competition,
            Season: season,
            Scorer: translatePlayerName(text.match(minRegex)[0]),
            //Assist: null,
            GoalType: '',
            //AssistType: null,
            Minute: minute[i],
        }
        console.log("Opp:" + goal.Opposition);
        goal.Opposition = translateTeamName(goal.Opposition);

        if(text.indexOf('(pen') > 0)
            goal.GoalType = "Penalty"

        if(text.indexOf('(og') > 0)
            goal.Scorer = "Own Goal"

        if(text.indexOf('s/o') == -1)
            goals.push(goal);
    }
  });


  const apps = [];
  rows.each((i, el) => {

    // Extract information from each row of the jobs table
    if(i != 0 &&  i != 12 ) {

        var playerIndex = awayTeam == "Tranmere" ? 3 : 0;
        var numberIndex = awayTeam == "Tranmere" ? 1 : 2;
        var cardIndex = awayTeam == "Tranmere" ? 0 : 3;

        const regex = /\s+\(\d+\)/g;
        const minRegex = /\d+/g
        var originalText = $($(el).find("td")[playerIndex]).text()
        var text = originalText.replace(regex, '')

        var yellowCard = $($(el).find("td")[cardIndex]).children().first() ? $($(el).find("td")[cardIndex]).children().first().attr('title') : null;
        var yellow = null;
        var red = null;

        if(yellowCard && yellowCard.indexOf('ellow') > -1) {
            yellow = 'TRUE'
        }
        if(yellowCard && yellowCard.indexOf('Red') > -1) {
            red = 'TRUE'
        }

        const sub = originalText.match(minRegex);
        var subMin;
        if(sub && !red) {            
            subMin = sub[0];
        }
        var app = {
            id: uuidv4(),
            Date: date,
            Opposition: awayTeam == "Tranmere" ? homeTeam : awayTeam,
            Competition:  competition,
            Season: season,
            Name: translatePlayerName(text),
            Number: $($(el).find("td")[numberIndex]).text(),
            SubbedBy: null,
            SubTime: subMin,
            YellowCard: yellow,
            RedCard: red,
            SubYellow: null,
            SubRed: null
        }

        app.opposition = translateTeamName(app.opposition);

        if(app.Number == "N/A")
            app.Number = null;

        if(i < 12)
            apps.push(app);
        else if(subMin) {
            for(var y=0; y < apps.length; y++) {
                if(apps[y].SubTime == subMin && !apps[y].SubbedBy) {
                   var subName = text.replace(/\(.*\)\s/, '');
                   apps[y].SubbedBy = translatePlayerName(subName);
                   apps[y].SubYellow = yellow;
                   apps[y].SubRed= red;
                   break;
                }
            }
        }
    }
  });

  return {goals: goals, apps: apps};
}

function extractMatchesFromHTML (html) {
  const $ = cheerio.load(html);

  var games = [];
  const matches = $('tr.match');

//<span class="hide"> League One 2019-08-03 15:00 </span>

  matches.each((i, el) => {

    var date = $($(el).find('span.hide')[0]).text();
    var dateRegex = /\d\d\d\d-\d\d-\d\d/g;
    var compRegex = /[\w\s]+/g
    const dateMatch = date.match(dateRegex);
    const compMatch = date.match(compRegex);
    var comp = compMatch[0];

    if(comp.indexOf('EFL Cup') > 0) {
        comp = "League Cup"
    } else if(comp.indexOf('League Cup') > 0) {
        comp = "League Cup"
    } else if(comp.indexOf('FA Cup') > 0) {
        comp = "FA Cup"
    } else if(comp.indexOf('League One') > 0) {
        comp = "League"
    } else if(comp.indexOf('League Two') > 0) {
        comp = "League"
    } else if(comp.indexOf('Football League Trophy') > 0) {
        comp = "FL Trophy"
    } else if(comp.indexOf('National League') > 0) {
        comp = "Conference"
    } else if(comp.indexOf('Play') > 0) {
        comp = "Play Offs"
    } else if(comp.indexOf('FA Trophy') > 0) {
        comp = "FA Trophy"
    } else if(comp.indexOf('Football League Div 1') > 0) {
        comp = "League"
    } else if(comp.indexOf('Football League Div 2') > 0) {
        comp = "League"
    } else if(comp.indexOf('Capital One Cup') > 0) {
        comp = "League Cup"
    } else if(comp.indexOf('Carling Cup') > 0) {
        comp = "League Cup"
    } else if(comp.indexOf('JP Trophy') > 0) {
        comp = "FL Trophy"
    } else if(comp.indexOf('EFL Trophy') > 0) {
        comp = "FL Trophy"
    }

    var match = {
        scrape_id : $(el).attr('id').replace('tgc',''),
        id: uuidv4(),
        date: dateMatch[0],
        competition: comp,
        programme: "#N/A",
        pens: ""
    };
    games.push(match);
  });

  return games;
}

function translatePlayerName(input) {

    const regex = /\s*\(s\/o\s\d+\)\s*/g;
    input = input.replace(regex, '');

    var mapping = {
        'A Chapman':'Aaron Chapman',
        'A Collins':'Aaron Collins',
        'A Cresswell':'Aaron Cresswell',
        'A Bell-Baggie':'Abdulai Bell-Baggie',
        'A Buxton':'Adam Buxton',
        'A Dawson':'Adam Dawson',
        'A Dugdale':'Adam Dugdale',
        'A McGurk':'Adam McGurk',
        'A Mekki':'Adam Mekki',
        'A Proudlock':'Adam Proudlock',
        'A Ahmed':'Adnan Ahmed',
        'A Thorpe':'Adrian Thorpe',
        'A Sodje':'Akpo Sodje',
        'A Mahon':'Alan Mahon',
        'A Morgan':'Alan Morgan',
        'A Navarro':'Alan Navarro',
        'A Rogers':'Alan Rogers',
        'A Chamberlain':'Alec Chamberlain',
        'A Bruce':'Alex Bruce',
        'A Hay':'Alex Hay',
        'A Woodyard':'Alex Woodyard',
        'A Jones':'Andrai Jones',
        'A Ralph':'Andrew Ralph',
        'A Cook':'Andy Cook',
        'A Coughlin':'Andy Coughlin',
        'A Mangan':'Andy Mangan',
        'A Mathieson':'Andy Mathieson',
        'A Moran':'Andy Moran',
        'A Parkinson':'Andy Parkinson',
        'A Robinson':'Andy Robinson',
        'A Taylor':'Andy Taylor',
        'A Thompson':'Andy Thompson',
        'A Thorn':'Andy Thorn',
        'A Thorpe':'Andy Thorpe',
        'A Kay':'Anthony Kay',
        'A Boland':'Antonie Boland',
        'A Gnanduillet':'Armand Gnanduillet',
        'A Mendy':'Arnaud Mendy',
        'A Taylor':'Ash Taylor',
        'B Passant':'Bailey Passant',
        'B Thompson':'Bailey Thompson',
        'B Savage':'Bas Savage',
        'B Chorley':'Ben Chorley',
        'B Davies':'Ben Davies',
        'B Gibson':'Ben Gibson',
        'B Gordon':'Ben Gordon',
        'B Hinchliffe':'Ben Hinchliffe',
        'B Jago':'Ben Jago',
        'B Jones':'Ben Jones',
        'B Maher':'Ben Maher',
        'B Pringle':'Ben Pringle',
        'B Tollitt':'Ben Tollitt',
        'B Tomlinson':'Ben Tomlinson',
        'B Ashcroft':'Billy Ashcroft',
        "B O'Rourke":"Billy O'Rourke",
        'B Woods':'Billy Woods',
        'B Watkins':'Brad Watkins',
        'C Jahraldo-Martin':'Calaum Jahraldo-Martin',
        'C Lucy':'Callum Lucy',
        'C Morris':'Callum Morris',
        'C Woods':'Calum Woods',
        'C Zola':'Calvin Zola',
        'C Borthwick-Jackson':'Cameron Borthwick-Jackson',
        'C Spellman':'Carl Spellman',
        'C Tremarco':'Carl Tremarco',
        'C Barnett':'Charlie Barnett',
        'C Atkinson':'Chris Atkinson',
        'C Camden':'Chris Camden',
        'C Dagnall':'Chris Dagnall',
        'C Edwards':'Chris Edwards',
        'C Greenacre':'Chris Greenacre',
        'C Malkin':'Chris Malkin',
        'C McCready':'Chris McCready',
        'C Shuker':'Chris Shuker',
        'C McDonald':'Clayton McDonald',
        'C Hill':'Clint Hill',
        'C Stockton':'Cole Stockton',
        'C Clarke':'Colin Clarke',
        'C Jennings':'Connor Jennings',
        'C Blackett-Taylor':'Corey Blackett-Taylor',
        'C Curran':'Craig Curran',
        'C Russell':'Craig Russell',
        'C Taylor':'Corey Blackett-Taylor',
        'D Jennings':'Dale Jennings',
        'D Gardner':'Dan Gardner',
        'D Woodards':'Dan Woodards',
        'D Coyne':'Danny Coyne',
        'D Harrison':'Danny Harrison',
        'D Holmes':'Danny Holmes',
        'D Johnson':'Danny Johnson',
        'D Mayor':'Danny Mayor',
        'D Walker-Rice':'Danny Walker-Rice',
        'D Kubicki':'Dariusz Kubicki',
        'D Askew':'Darren Askew',
        'D Potter':'Darren Potter',
        'D Stephenson':'Darren Stephenson',
        'D Challinor':'Dave Challinor',
        'D Higgins':'Dave Higgins',
        'D Martindale':'Dave Martindale',
        'D Amoo':'David Amoo',
        'D Beresford':'David Beresford',
        'D Buchanan':'David Buchanan',
        'D Fairclough':'David Fairclough',
        'D Kelly':'David Kelly',
        'D Martin':'David Martin',
        'D Perkins':'David Perkins',
        'D Raven':'David Raven',
        'D Drysdale':'Declan Drysdale',
        'D Facey':'Delroy Facey',
        'D Hamilton':'Des Hamilton',
        'D Green':'Devarn Green',
        'D Seremet':'Dino Seremet',
        'D Hebel':'Dirk Hebel',
        'D Daniels':'Donervon Daniels',
        'D Anderson':'Doug Anderson',
        'D Traore':'Drissa Traore',
        'D Mottley Henry':'Dylan Mottley Henry',
        'E Bishop':'Eddie Bishop',
        'E Clarke':'Eddie Clarke',
        'E Murray':'Eddie Murray',
        'E Sonko':'Edrissa Sonko',
        'E Richards':'Eliot Richards',
        'E Osborne':'Elliot Osborne',
        'E Rokka':'Elliot Rokka',
        'E Monthe':'Manny Monthe',
        'E Showunmi':'Enoch Showunmi',
        'E Nixon':'Eric Nixon',
        'E Sousa':'Erico Sousa',
        'E Jones':'Ethan Jones',
        'E Dadi':'Eugene Dadi',
        'E Gumbs':'Evan Gumbs',
        'E Horwood':'Evan Horwood',
        'F Worthington':'Frank Worthington',
        'F Akammadu':'Franklyn Akammadu',
        'G Edds':'Gareth Edds',
        'G Powell':'Gareth Powell',
        'G Roberts':'Gareth Roberts',
        'G Taylor':'Gareth Taylor',
        'G Bauress':'Gary Bauress',
        'G Jones':'Gary Jones',
        'M Stevens':'Gary Stevens',
        'G Taylor-Fletcher':'Gary Taylor-Fletcher',
        'G Williams':'Gary Williams',
        'G Gunning':'Gavin Gunning',
        'G Ward':'Gavin Ward',
        'G Ariyibi':'Gboly Ariyibi',
        'G Brannan':'Ged Brannan',
        'G Barker':'George Barker',
        'G Donnelly':'George Donnelly',
        'G Green':'George Green',
        'G Nugent':'George Nugent',
        "G O'Callaghan":"George O'Callaghan",
        'G Ray':'George Ray',
        'G Waring':'George Waring',
        'G Santos':'Georges Santos',
        'G Bruna':'Gerardo Bruna',
        'G McDonagh':'Gerry McDonagh',
        'G Antwi':'Godwin Antwi',
        'G Allen':'Graham Allen',
        'G Branch':'Graham Branch',
        'G Nielsen':'Gunnar Nielsen',
        'G Madjo':'Guy Madjo',
        'H Gilmour':'Harvey Gilmour',
        'I Anderson':'Iain Anderson',
        'I Hume':'Iain Hume',
        'I Turner':'Iain Turner',
        'A Feuer':'Ian Feuer',
        'I Goodison':'Ian Goodison',
        'I Muir':'Ian Muir',
        'I Nolan':'Ian Nolan',
        'I Sharps':'Ian Sharps',
        'I Thomas-Moore':'Ian Thomas-Moore',
        'I Onuora':'Iffy Onuora',
        'I Miller':'Ishmael Miller',
        'I Bonetti':'Ivano Bonetti',
        'J Dunn':'Jack Dunn',
        'J Flemming':'Jack Flemming',
        'J Mackreth':'Jack Mackreth',
        'J Maddox':'Jacob Maddox',
        'J Burton':'Jake Burton',
        'J Caprice':'Jake Caprice',
        'J Cassidy':'Jake Cassidy',
        'J Jervis':'Jake Jervis',
        'J Kirby':'Jake Kirby',
        'J Alabi':'James Alabi',
        'J Devine':'James Devine',
        'J McEveley':'James McEveley',
        'J Norwood':'James Norwood',
        'J Olsen':'James Olsen',
        'J Rowe':'James Rowe',
        'J Vaughan':'James Vaughan',
        'J Wallace':'James Wallace',
        'J McGuire':'Jamie McGuire',
        'J Donacien':'Janoi Donacien',
        'J Koumas':'Jason Koumas',
        'J McAteer':'Jason McAteer',
        'J Price':'Jason Price',
        'J Harris':'Jay Harris',
        'J Hughes':'Jeff Hughes',
        'J Kenna':'Jeff Kenna',
        'J Myrie-Williams':'Jennison Myrie-Williams',
        'J Grandison':'Jermaine Grandison',
        'J Harvey':'Jim Harvey',
        'J McNulty':'Jim McNulty',
        'J Steel':'Jim Steel',
        'J Blackham':'Joe Blackham',
        'J Collister':'Joe Collister',
        'J Hart':'Joe Hart',
        'J Murphy':'Joe Murphy',
        'J Thompson':'Joe Thompson',
        'J Achterberg':'John Achterberg',
        'J Aldridge':'John Aldridge',
        'J Clayton':'John Clayton',
        'J Johnson':'John Johnson',
        'J McGreal':'John McGreal',
        'J Morrissey':'John Morrissey',
        'J Mullin':'John Mullin',
        'J Smith':'John Smith',
        'J Thompson':'John Thompson',
        'J Welsh':'John Welsh',
        'J Akpa Akpro':'John-Louis Akpa Akpro',
        'J Kenworthy':'Jon Kenworthy',
        'J Otsemobor':'Jon Otsemobor',
        'J Margetts':'Jonny Margetts',
        'J Smith':'Jonny Smith',
        'J Hugill':'Jordan Hugill',
        'J Ponticelli':'Jordan Ponticelli',
        'J Baxter':'Jose Baxter',
        'J Ginnelly':'Josh Ginnelly',
        'J Kay':'Josh Kay',
        'J Macauley':'Josh Macauley',
        'J Solomon-Davies':'Josh Solomon-Davies',
        'J Thompson':'Josh Thompson',
        'J Labadie':'Joss Labadie',
        'J Brown':'Junior Brown',
        'K Wilson':'Kane Wilson',
        'K Brown':'Kaylden Brown',
        'K Odejayi':'Kayode Odejayi',
        'K Welch':'Keith Welch',
        'K McKenna':'Ken McKenna',
        'K Irons':'Kenny Irons',
        'K Cooper':'Kevin Cooper',
        'K Ellison':'Kevin Ellison',
        'K Gray':'Kevin Gray',
        'K McIntyre':'Kevin McIntyre',
        'K Morris':'Kieron Morris',
        'K Bain':'Kithson Bain',
        'K Peterson':'Kristoffer Peterson',
        'K Hayde':'Kyle Hayde',
        'L Cole':'Larnell Cole',
        'L Elford Alliyu':'Lateef Elford Alliyu',
        'L Jones':'Lee Jones',
        'L Molyneux':'Lee Molyneux',
        'L Vaughan':'Lee Vaughan',
        'L Sinnot':'Lewis Sinnot',
        'L Benson':'Liam Benson',
        'L Darville':'Liam Darville',
        'L Davies':'Liam Davies',
        'L Hogan':'Liam Hogan',
        "L O'Brien":"Liam O'Brien",
        'L Palmer':'Liam Palmer',
        'L Ridehalgh':'Liam Ridehalgh',
        'L Maynard':'Lois Maynard',
        'L Almond':'Louis Almond',
        'L Akins':'Lucas Akins',
        'L Daniels':'Luke Daniels',
        'L McCullough':'Luke McCullough',
        "L O'Neill":"Luke O'Neill",
        'L Pilling':'Luke Pilling',
        'L Waterfall':'Luke Waterfall',
        'M Sidibe':'Mamady Sidibe',
        'M Monthe':'Manny Monthe',
        'M Laird':'Marc Laird',
        'M Holness':'Marcus Holness',
        'M Ellis':'Mark Ellis',
        'M Hughes':'Mark Hughes',
        'M McCarrick':'Mark McCarrick',
        'M McChrystal':'Mark McChrystal',
        'M Proctor':'Mark Proctor',
        'S Rankine':'Mark Rankine',
        'M Wilson':'Mark Wilson',
        'M Broomes':'Marlon Broomes',
        'M Jackson':'Marlon Jackson',
        'M Devaney':'Martin Devaney',
        'M Pike':'Martin Pike',
        'M Riley':'Martin Riley',
        'M Robinson':'Marvin Robinson',
        'M Sordell':'Marvin Sordell',
        'M Gill':'Matt Gill',
        'M Hill':'Matt Hill',
        'M Murray':'Matt Murray',
        'M Kennedy':'Matthew Kennedy',
        'M Pennington':'Matthew Pennington',
        'M Fanimo':'Matthias Fanimo',
        'M Power':'Max Power',
        'M Blanchard':'Maxime Blanchard',
        'M Black':'Michael Black',
        'M Higdon':'Michael Higdon',
        'M Ihiekwe':'Michael Ihiekwe',
        'M Johnston':'Michael Johnston',
        'M Kay':'Michael Kay',
        "M O'Halloran":"Michael O'Halloran",
        'M Ricketts':'Michael Ricketts',
        'M Mellon':'Micky Mellon',
        'M Jackson':'Mike Jackson',
        'M Jones':'Mike Jones',
        'M Duggan':'Mitch Duggan',
        'M Feeney':'Morgan Feeney',
        'M Ferrier':'Morgan Ferrier',
        'M Tiryaki':'Mustafa Tiryaki',
        'N Blissett':'Nathan Blissett',
        'N Eccleston':'Nathan Eccleston',
        'N Ashton':'Neil Ashton',
        'N Danns':'Neil Danns',
        'N Gibson':'Neil Gibson',
        'N McNab':'Neil McNab',
        'N Henry':'Nick Henry',
        'N Wood':'Nick Wood',
        'N Summerbee':'Nicky Summerbee',
        'N Adkins':'Nigel Adkins',
        'O Banks':'Ollie Banks',
        'O James':'Oliver James',
        'O Norburn':'Ollie Norburn',
        'O Fon-Williams':'Owain Fon-Williams',
        'P Wharton':'Paddy Wharton',
        'P McGibbon':'Pat McGibbon',
        'P Nevin':'Pat Nevin',
        'P Aldridge':'Paul Aldridge',
        'P Black':'Paul Black',
        'P Brown':'Paul Brown',
        'P Collings':'Paul Collings',
        'P Cook':'Paul Cook',
        'P Corry':'Paul Corry',
        'P Hall':'Paul Hall',
        'P Henry':'Paul Henry',
        'P Linwood':'Paul Linwood',
        'P McLaren':'Paul McLaren',
        'P Mullin':'Paul Mullin',
        'P Rachubka':'Paul Rachubka',
        'P Rideout':'Paul Rideout',
        'P Matias':'Pedro Matias',
        'P Taylor':'Perry Taylor',
        'P Brezovan':'Peter Brezovan',
        'P Clarke':'Peter Clarke',
        'P Gulacsi':'Peter Gulacsi',
        'P Kennedy':'Peter Kennedy',
        'P Babb':'Phil Babb',
        'P Whitehead':'Phil Whitehead',
        'P Palethorpe':'Philip Palethorpe',
        'R Train':'Ray Train',
        'R Hazell':'Reuben Hazell',
        'R Taylor':'Rhys Taylor',
        'R Hinds':'Richard Hinds',
        'R Jobson':'Richard Jobson',
        'R Sutton':'Richie Sutton',
        'R Burns':'Robbie Burns',
        'R Stockdale':'Robbie Stockdale',
        'R Weir':'Robbie Weir',
        'R Taylor':'Robert Taylor',
        'R Golobart':'Roman Golobart',
        'R Goodlass':'Ronnie Goodlass',
        'R Moore':'Ronnie Moore',
        'R Donnelly':'Rory Donnelly',
        'R Hepburn-Murphy':'Rushian Hepburn-Murphy',
        'R Howarth':'Russell Howarth',
        'R Brunt':'Ryan Brunt',
        'R Donaldson':'Ryan Donaldson',
        'R Edwards':'Ryan Edwards',
        'R Fraughan':'Ryan Fraughan',
        'R Lowe':'Ryan Lowe',
        'R Shotton':'Ryan Shotton',
        'R Taylor':'Ryan Taylor',
        'R Williams':'Ryan Williams',
        'S Aiston':'Sam Aiston',
        'S Ilesanmi':'Sam Ilesanmi',
        'S Mantom':'Sam Mantom',
        'S Morrow':'Sam Morrow',
        'S Ramsbottom':'Sam Ramsbottom',
        'S Davies':'Scott Davies',
        'S Fenwick':'Scott Fenwick',
        'S Taylor':'Sam Taylor',
        'S Wootton':'Scott Wootton',
        'S Connelly':'Sean Connelly',
        'S Flynn':'Sean Flynn',
        'S McGinty':'Sean McGinty',
        'S Thornton':'Sean Thornton',
        'S Carole':'Sebastien Carole',
        "S N'Diaye":"Seyni N'Diaye",
        'S Logan':'Shaleum Logan',
        'S George':'Shamal George',
        'S Fenelon':'Shamir Fenelon',
        'S Cansdell-Sherriff':'Shane Cansdell-Sherriff',
        'S McWeeney':'Shane McWeeney',
        'S Nicholson':'Shane Nicholson',
        'S Garnett':'Shaun Garnett',
        'S Teale':'Shaun Teale',
        'S Nelson':'Sid Nelson',
        'S Francis':'Simon Francis',
        'S Haworth':'Simon Haworth',
        'S Miotto':'Simon Miotto',
        'S Osborn':'Simon Osborn',
        'S Payne':'Stefan Payne',
        'S Arthurworrey':'Stephen Arthurworrey',
        'S Foster':'Stephen Foster',
        'S Frail':'Stephen Frail',
        'S Cooper':'Steve Cooper',
        'S Craven':'Steve Craven',
        'S Edwards':'Steve Edwards',
        'S McNulty':'Steve McNulty',
        'S Mungall':'Steve Mungall',
        'S Simonsen':'Steve Simonsen',
        'S Vickers':'Steve Vickers',
        'S Wilson':'Steve Wilson',
        'S Yates':'Steve Yates',
        'S Jennings':'Steven Jennings',
        "S O'Leary":"Steven O'Leary",
        'S Barlow':'Stuart Barlow',
        'T Gornell':'Terry Gornell',
        'T Whitmore':'Theodore Whitmore',
        'T Baker':'Thomas Baker',
        'T Myhre':'Thomas Myhre',
        'T Cathalina':'Timothy Cathalina',
        'T Omotola':'Tolani Omotola',
        'T Coughan':'Tom Coughan',
        'T Curtis':'Tom Curtis',
        'T Hateley':'Tom Hateley',
        'T Coyne':'Tommy Coyne',
        'T Grant':'Tony Grant',
        'T Thomas':'Tony Thomas',
        'T Warner':'Tony Warner',
        'T Loran':'Tyrone Loran',
        'U Akpan':'Udoyen Akpan',
        'W Allison':'Wayne Allison',
        'W Gill':'Wayne Gill',
        'W Aimson':'Will Aimson',
        'W Vaulks':'Will Vaulks',
        'Z Bakayogo':'Zoumana Bakayogo',
        'Corey Taylor': 'Corey Blackett-Taylor',
        'Oliver Banks': 'Ollie Banks',
        'Oliver Norburn': 'Ollie Norburn',
        'Emmanuel Monthe': 'Manny Monthe',
        'O Fon Williams': 'Owain Fon-Williams',
        'H McGahey':'Harrison McGahey',
        'J Mooney':'Jason Mooney',
        'Jonathon Margetts':'Jonny Margetts',
        'D Lloyd':'Danny Lloyd',
        'K Woolery':'Kaiyne Woolery',
        'P Lewis':'Paul Lewis',
        'O Khan':'Otis Khan',
        'N Kirby':'Nya Kirby',
        'C MacDonald':'Calum MacDonald',
        "L O'Connor": "Lee O'Connor",
        "J Spearing": "Jay Spearing",
        "L Feeney": "Liam Feeney",
        "A Crawford": "Ali Crawford",
        "C Jolley": "Charlie Jolley",
        "D Nugent": "David Nugent",
        "C Merrie": "Chris Merrie",
        "R Watson": "Ryan Watson",
        "C McManaman": "Callum McManaman",
        "P Glatzel": "Paul Glatzel",
        "T Davies": "Tom Davies",
        "E Dieseruvwe": "Emmanuel Dieseruvwe",
        "J Maguire": "Joe Maguire",
        "S Foley": "Sam Foley",
        "J Dacres-Cogley": "Josh Dacres-Cogley",
        "E Nevitt": "Elliott Nevitt",
        "R Doohan": "Ross Doohan",
        "N Knight-Percival": "Nat Knight-Percival",
        "M Duffy": "Mark Duffy",
        "N Maynard": "Nicky Maynard",
        "J Hawkes": "Josh Hawkes",
        "S Walker": "Stephen Walker",
        "K Hemmings": "Kane Hemmings",
        "J McPake": "Josh McPake",
        "L Warrington": "Lewis Warrington",
        "J Nolan": "Jon Nolan",
        "E Bristow": "Ethan Bristow",
        "K Jameson": "Kyle Jameson",
        "L Robinson": "Luke Robinson",
        "N Byrne": "Neill Byrne",
        "R McAlear": "Reece McAlear",
        "R Hughes": "Rhys Hughes",
        "J Turnbull": "Jordan Turnbull",
        "B Hockenhull": "Ben Hockenhull",
        "J Mumbongo": "Joel Mumbongo",
        "M Hewelt": "Mateusz Hewelt",
        "D Simeu": "Dynel Simeu",
        "A Lomax": "Arthur Lomax"
    }

    return mapping[input.trim()] ? mapping[input.trim()] : input.trim();
}

function translateTeamName(input) {

    var lookup = input ? input.trim() : "";
    
    var mapping = {
        'Salford': 'Salford City',
        'Newport Co': 'Newport County',
        'Hartlepool': 'Hartlepool United',
        'Accrington': 'Accrington Stanley',
        'Scunthorpe': 'Scunthorpe United',
        'Bolton': 'Bolton Wanderers',
        'Mansfield': 'Mansfield Town',
        'Oldham': 'Oldham Athletic',
        'Swindon': 'Swindon Town',
        'Carlisle': 'Carlisle United',
        'Exeter': 'Exeter City',
        'Bristol R': 'Bristol Rovers',
        'Harrogate': 'Harrogate Town',
        'Crewe': 'Crewe Alexandra',
        'Stockport': 'Stockport County',
        'Grimsby': 'Grimsby Town',
        'Northampton': 'Northampton Town',
        'Crawley': 'Crawley Town',
        'Colchester': 'Colchester United',
        'Bradford': 'Bradford City',
        'Doncaster': 'Doncaster Rovers'
    }
    return mapping[lookup] ? mapping[lookup] : lookup;
}

module.exports = {
  extractSquadFromHTML, extractMatchesFromHTML, extractExtraFromHTML, getYear
};