// Create Agora client
var client = AgoraRTC.createClient({
    mode: "rtc",
    codec: "vp8"
});

var remoteUsers = {};

var localTracks = {
    videoTrack: null,
    audioTrack: null
};

// Agora client options
var options = {
    appid: null,
    channel: null,
    uid: null,
    token: null,
    accountName: null
};

$("#join-form").submit(async function (e) {
    e.preventDefault();
    $("#join").attr("disabled", true);
    try {
        options.appid = $("#appid").val();
        options.token = $("#token").val();
        options.channel = $("#channel").val();
        options.accountName = $('#accountName').val();
        await join();
    } catch (error) {
        console.error(error);
    } finally {
        $("#leave").attr("disabled", false);
    }
})

$("#leave").click(function (e) {
    leave();
})

async function join() {
    $("#mic-btn").prop("disabled", false);
    $("#video-btn").prop("disabled", false);
    RTMJoin(options.uid);
    client.on("user-published", handleUserPublished);
    client.on("user-left", handleUserLeft);
    [options.uid, localTracks.audioTrack, localTracks.videoTrack] = await Promise.all([
        // join the channel
        client.join(options.appid, options.channel, options.token),
        // create local tracks, using microphone and camera
        AgoraRTC.createMicrophoneAudioTrack(),
        AgoraRTC.createCameraVideoTrack()
    ]);
    // play local video track
    localTracks.videoTrack.play("local-player");
    $("#local-player-name").text(`${options.uid} - Local User`);
    // publish local tracks to channel
    await client.publish(Object.values(localTracks));
    
}

async function leave() {
    for (trackName in localTracks) {
        var track = localTracks[trackName];
        if (track) {
            track.stop();
            track.close();
            $('#mic-btn').prop('disabled', true);
            $('#video-btn').prop('disabled', true);
            localTracks[trackName] = undefined;
        }
    }

    // remove remote users and player views
    remoteUsers = {};

    $("#remote-playerlist").html("");
    // leave the channel
    await client.leave();
    $("#local-player-name").text("");
    $("#join").attr("disabled", false);
    $("#leave").attr("disabled", true);
    console.log("client leaves channel success");
}

async function subscribe(user, mediaType) {
    const uid = user.uid;
    // subscribe to a remote user
    await client.subscribe(user, mediaType);
    console.log("subscribe success");
    if (mediaType === 'video') {
        const player = $(`
      <div id="player-wrapper-${uid}">
        <p class="player-name">${uid} - Remote User</p>
        <div id="player-${uid}" class="player"></div>
      </div>
    `);
        $("#remote-playerlist").append(player);
        user.videoTrack.play(`player-${uid}`);
    }
    if (mediaType === 'audio') {
        user.audioTrack.play();
    }
}

// Handle user publish
function handleUserPublished(user, mediaType) {
    const id = user.uid;
    remoteUsers[id] = user;
    subscribe(user,  mediaType);
}

// Handle user left
function handleUserLeft(user) {
    const id = user.uid;
    delete remoteUsers[id];
    $(`#player-wrapper-${id}`).remove();
}

enableUiControls();

function enableUiControls() {
    $("#mic-btn").click(function () {
        toggleMic();
    });
    $("#video-btn").click(function () {
        toggleVideo();
    });
}

function toggleMic() {
    $("#mic-icon").hasClass('fa-microphone') ?
        localTracks.audioTrack.setEnabled(false) :
        localTracks.audioTrack.setEnabled(true);
    $("#mic-icon").toggleClass('fa-microphone').toggleClass('fa-microphone-slash');
}

function toggleVideo() {
    $("#video-icon").hasClass('fa-video') ?
        localTracks.videoTrack.setEnabled(false) :
        localTracks.videoTrack.setEnabled(true);
    $("#video-icon").toggleClass('fa-video').toggleClass('fa-video-slash');
}