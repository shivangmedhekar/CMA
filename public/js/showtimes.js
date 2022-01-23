(function($) {

    displayMovieName();

    // Set today's date on calender
    const todaysDate = new Date();
    // Today's date set in Input type Date for value and minimum selection
    document.getElementById("calender").value = `${todaysDate.getFullYear()}-0${todaysDate.getMonth() + 1}-${todaysDate.getDate()}`;
    document.getElementById("calender").min = `${todaysDate.getFullYear()}-0${todaysDate.getMonth() + 1}-${todaysDate.getDate()}`;

    // Search for shows on page
    const todaysDateFormated = dateFormatingForSearch(todaysDate);
    getShows(todaysDateFormated);

    // Search for shows by selection of date and click on search button
    searchByDate();

    function dateFormatingForSearch(date){
        const formatedDate = date.toLocaleDateString().split('/');
        return `${formatedDate[0]}-${formatedDate[1]}-${formatedDate[2].substring(2,4)}`
    }


    function searchByDate() {
        $('#searchBtn').on("click", function (){
            const calenderDate = ($('#calender').val()).split('-');
            const calenderFormatedDate = `${calenderDate[1]}-${calenderDate[2]}-${calenderDate[0]}`;

            const searchDate = dateFormatingForSearch(new Date(calenderFormatedDate));

            $('#show-list').empty()
            getShows(searchDate);
        })
    }

    async function displayMovieName(){
        const result = await $.ajax({
            method: 'GET',
            url: '/movie/getMovieBySlug/' + slug
        });
        console.log(result.movie.movieName)
        $("#movie-name").html(result.movie.movieName);
    }

    async function getTheaters() {

        const result = await $.ajax({
            method: 'GET',
            url: '/theater/getAllTheaters/'
        });
        return result.theaters
    }
    getShows();
    async function getShows(searchDate){
        let theaters = await getTheaters();

        for (let theater of theaters){
            let theaterDiv = `<div id="${theater.slug}">`
            let theaterName = `<h3>${theater.name}</h3>`
            console.log(theater.name)
            const result = await $.ajax({
                method: 'POST',
                url: `/showtimes/getshows/${theater.id}/${slug}/${searchDate}` ,
            });

            let conditionalDiv;
            if (result['error']) {
                const errorMsg = 'Sorry, No shows available for this movie';
                conditionalDiv = ''
            }
            else {
                let digital = [];
                let imax = [];
                let dolby = [];
                let prime = [];

                for (let show of result) {
                    if (show.format.length == 0)
                        digital.push(show);
                    else if (show.format.includes("IMAX"))
                        imax.push(show)
                    else if (show.format.includes('Dolby'))
                        dolby.push(show)
                    else prime.push(show)
                }
                const showsByFormat = [digital, imax, dolby, prime];


                let formatDiv = '';
                for (let format in showsByFormat) {
                    let formatHeading = '';
                    let flag = false
                    if (showsByFormat[format].length > 0) flag = true

                    if (format == 0 && flag) formatHeading = 'Digital';
                    else if (format == 1 && flag) formatHeading = 'IMAX';
                    else if (format == 2 && flag) formatHeading = 'Dolby';
                    else if (format == 3 && flag)formatHeading = 'Prime';

                    let showList = '<li>';
                    for (let show of showsByFormat[format]){

                        let showtime = new Date(show.showtime);
                        if (showtime - todaysDate < 0)
                            showList += `<ul>${showtime.toLocaleTimeString()}</ul>`
                        else
                            showList += `<ul> <a href="${show.id}/"> ${showtime.toLocaleTimeString()}</a></ul>`
                    }
                    showList += '</li>'
                    if (flag)
                        formatDiv += formatHeading + showList
                }
                conditionalDiv = theaterName + formatDiv
            }
            let divToAppend = theaterDiv + conditionalDiv + '</div>'
            $('#show-list').append(divToAppend);
        }
    }

    async function displayTheaterName(theaterId){

        const result = await $.ajax({
            method: 'GET',
            url: '/theater/getTheaterNameById/' + theaterId
        });

        $("#show-list").append('<h2>' + result.theaterName +'</h2>');
    }

    async function getShowsForMovie() {

        const result = await $.ajax({
            method: 'POST',
            url: 'getshows/' + movieId,
        });
        return result;
    }

    async function displayShows() {
        const showList = await getShowsForMovie();

        let theaterId, screenNo;
        for (let theater of showList.theaters){

            theaterId = theater.theaterId;
            await displayTheaterName(theaterId);

            for (let screen of theater.screens){
                screenNo = screen.screenNo;
                $("#show-list").append('<h2> Screen No ' + screenNo +'</h2>');
                console.log(screenNo);
                for (let show of screen.shows){
                    const showtime = new Date(show.showTime).getTime();

                    let url = `/seatselection/${movieId}/${theaterId}/${screenNo}/${showtime}`;
                    const showTimeString = new Date(show.showTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
                    $("#show-list").append('<li><a href='+url + ' >' + showTimeString + '</a></li>');
                }
            }
        }
    }

})(window.jQuery);