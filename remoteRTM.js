async function RTMJoin(uid) {
    // Create Agora RTM client
    const appid = "d11aa12099fb42bd8f1102de2aef8124";
    const clientRTM = AgoraRTM.createInstance(appid, {
        enableLogUpload: false
    });

    var accountName = $('#accountName').val();

    await clientRTM.login({
        uid: accountName, token: null
    }).then(() => {
        console.log('AgoraRTM client login success. Username: ' + accountName);
        isLoggedIn = true;
        // RTM Channel Join
        var channelName = $('#channel').val();
        channel = clientRTM.createChannel(channelName);
        channel.join().then(() => {
            console.log('AgoraRTM client channel join success.');
            // Get all members in RTM Channel
            channel.getMembers().then((memberNames) => {
                console.log("------------------------------");
                console.log("All members in the channel are as follows: ");
                console.log(memberNames);
                var newHTML = $.map(memberNames, function (singleMember) {
                    if (singleMember != accountName) {
                        const element = document.getElementById("sendMessage");
                        element.id = `sendMessage remoteVideo-${singleMember}`;
                        return (`<li class="mt-2">
                  <div class="row">
                      <p>${singleMember}</p>
                   </div>
                 </li>`);
                    }
                });
                document.getElementById('totalMember').innerHTML = `No of Participants : ${memberNames.length}`;;
            });

            $(document).on('click', '.sendMessage', function () {
                const fullDivId = $(this).attr('id');
                const peerId = fullDivId.substring(fullDivId.indexOf("-") + 1);
                console.log("Remote microphone button pressed.");
                let peerMessage = $("#sendMessageText").val();

                var htmlText = `<li class="mt-2 message">
                <div class="row">
                    <p>${peerMessage}</p>
                 </div></li>
               `;
                document.getElementById('insert-all-users').innerHTML += htmlText;
                getTotalMembers().then((memberNames) => {
                    $.map(memberNames, function (singleMember) {
                        if (singleMember != accountName) {
                            clientRTM.sendMessageToPeer({
                                text: peerMessage
                            },
                                singleMember,
                            );
                        }
                    });
                    document.getElementById('insert-all-users').innerHTML += newHTML;
                })
            });

            clientRTM.on('MessageFromPeer', function ({
                text
            }, peerId) {
                console.log(peerId + " muted/unmuted your " + text);
                var htmlText = `<li class="mt-2">
                <div class="row">
                    <p>${peerId}</p>
                    <p>${text}</p>
                 </div></li>
               `;
                document.getElementById('insert-all-users').innerHTML += htmlText;
            })

            // Display channel member joined updated users
            channel.on('MemberJoined', function () {
                // Get all members in RTM Channel
                channel.getMembers().then((memberNames) => {
                    console.log("New member joined so updated list is: ");
                    console.log(memberNames);
                    document.getElementById('totalMembers').innerHTML = `"No of Participants : "${totalMembers}`;
                    var newHTML = $.map(memberNames, function (singleMember) {
                        if (singleMember != accountName) {
                            member = singleMember;
                            channel.sendMessageToPeer( {
                                text : memberNames.length }
                                , member);
                            return (`<li class="mt-2">
                      <div class="row">
                          <p>${singleMember}</p>
                       </div>
                     </li>`);
                        }
                    });
                    document.getElementById("sendMessage").innerHTML += newHTML;
                });
            })
            // Display channel member left updated users
            channel.on('MemberLeft', function () {
                // Get all members in RTM Channel
                channel.getMembers().then((memberNames) => {
                    console.log("A member left so updated list is: ");
                    console.log(memberNames);
                    let member = "";
                    var newHTML = $.map(memberNames, function (singleMember) {
                        if (singleMember != accountName) {
                            member = singleMember;
                            return (`<li class="mt-2">
                      <div class="row">
                          <p>${singleMember}</p>
                       </div>
                     </li>`);
                        }
                    });

                    document.getElementById('insert-all-users').innerHTML += htmlText;
                });
            });
        }).catch(error => {
            console.log('AgoraRTM client channel join failed: ', error);
        }).catch(err => {
            console.log('AgoraRTM client login failure: ', err);
        });
    });

    async function getTotalMembers() {
        return await channel.getMembers();
    }
    // Logout
    document.getElementById("leave").onclick = async function () {
        console.log("Client logged out of RTM.");
        await clientRTM.logout();
    }
}