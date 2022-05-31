$.fn.commentCards = function () {

  return this.each(function () {

    var $this = $(this),
      $cards = $this.find('.card'),
      $current = $cards.filter('.card--current'),
      $next;

    $cards.on('click', function () {
      if (!$current.is(this)) {
        $cards.removeClass('card--current card--out card--next');
        $current.addClass('card--out');
        $current = $(this).addClass('card--current');
        $next = $current.next();
        $next = $next.length ? $next : $cards.first();
        $next.addClass('card--next');
      }
    });

    if (!$current.length) {
      $current = $cards.last();
      $cards.first().trigger('click');
    }

    $this.addClass('cards--active');

  })

};

$('.cards').commentCards();

$(document).ready(function () {
  $('#comment').click(function () {
    var input = $('#input').val();
    $('.box').append(input + '<br>');
  });
});

/********* */
const firebaseConfig = {
  apiKey: "AIzaSyAYPF_k6MBimdXEkR5tfHo-AaDiYK2wjRU",
  authDomain: "project-advance.firebaseapp.com",
  databaseURL: "https://project-advance.firebaseio.com",
  projectId: "project-advance",
  storageBucket: "project-advance.appspot.com",
  messagingSenderId: "986793570142",
  appId: "1:986793570142:web:1a41e03d01d4094188e9cf",
  measurementId: "G-862SKPSKXE"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
firebase.analytics();
var store = firebase.firestore();
var db = firebase.database();
var storage = firebase.storage();

const commentForm = document.querySelector("#comment-form");
const commentBtn = document.querySelector(".comment-btn");
const commentsRef = db.ref("comments");

commentForm.addEventListener("submit", (e) => {
  e.preventDefault();
  var time = new Date();
  var comment = {
    username: commentForm.username.value,
    comment: commentForm.comment.value,
    time: time.toString(),
    edited: false
  };
  commentsRef.push(comment);
  Swal.fire("Successfully Added!", "", "success");
  commentForm.comment.value = "";
});

commentsRef.on(
  "value",
  (snap) => {
    $(".loading").remove();
    document.querySelector(".user-comments").innerHTML = "";
    var items = [];
    snap.forEach((item) => {
      var time = item.val().time;
      //console.log(item.val().time);
      items.push(item.key);
      time = time.split(" ");
      var edited = "";
      if (item.val().edited === true) edited = "Edited";
      var userTime = time[1] + " " + time[2] + ", " + time[3] + " " + time[4];

      var html = `
   <div class="comment-card">
     <div class="time">${getRelativeTime(userTime)}</div>
     <div class="username">${item.val().username}</div>
     <div class="comment">${item.val().comment}</div>
     <div class="edited">${edited}</div>
     <div class="tools">
     <div class="edit" id="${item.key}">
      <a class="modal-trigger" href="#edit">Edit</a>
     </div>
     <div class="delete" id="${item.key}">
     <a class="modal-trigger" href="#delete">Delete</a>
     </div>
     <div class="reply" id="${item.key}">
     <a class="modal-trigger" href="#replies"> Replies <span id="${
       "reply" + item.key
     }"></span></a>
     </div>
     </div>
   </div>
   `;
      document.querySelector(".user-comments").innerHTML += html;
    });

    //If no comment(s) then show msg
    if (items.length === 0)
      document.querySelector(
        ".user-comments"
      ).innerHTML = `<h5>No comments...</h5>`;

    //Counting comment(s)
    $(".comment-count").text("(" + items.length + ")");

    // Edit Comment
    // off prevent the event from triggering multiple times
    $(".edit").on("click", function () {
      var key = $(this)[0].id;
      console.log(key);
      const editForm = document.querySelector("#edit-form");
      const editCommentRef = db.ref("comments/" + key);
      editCommentRef.once("value", (snap) => {
        editForm.editBox.value = snap.val().comment;
      });

      $(".edit-btn").one("click", function () {
        editCommentRef.update({
          comment: editForm.editBox.value,
          edited: true
        });
        Swal.fire("Successfully Edited", "", "success");
      });
    });

    // Delete Comment
    $(".delete").on("click", function () {
      var key = $(this)[0].id;
      $(".delete-btn")
        .off()
        .on("click", function () {
          db.ref("comments/" + key).remove();
          Swal.fire("Successfully Deleted!", "", "success");
        });
    });

    // Replies
    $(".reply").on("click", function () {
      var key = $(this)[0].id;
      localStorage.setItem("root-comment-key", key);
      db.ref("comments/" + key).once("value", (item) => {
        var time = item.val().time;
        time = time.split(" ");
        var userTime = time[1] + " " + time[2] + ", " + time[3] + " " + time[4];
        var edited = "";
        if (item.val().edited === true) edited = "Edited";
        var root = `
    <div class="comment-card">
      <div class="time">${getRelativeTime(userTime)}</div>
      <div class="username">${item.val().username}</div>
      <div class="comment">${item.val().comment}</div>
      <div class="edited">${edited}</div>
      <div class="toggle-reply-btn"><a href="#">Reply</a></div>
    </div>
    `;
        document.querySelector(".root-comment").innerHTML = root;
      });

      $(".toggle-reply-btn").click(function () {
        $(".toggle-reply").toggle();
      });
      const repliesForm = document.querySelector("#replies-form");

      $(".reply-btn")
        .off()
        .on("click", function () {
          var time = new Date();
          if (
            repliesForm.username.value === "" ||
            repliesForm.reply.value === ""
          ) {
            Swal.fire("Please fill up!", "", "error");
          } else {
            var reply = {
              username: repliesForm.username.value,
              comment: repliesForm.reply.value,
              time: time.toString(),
              edited: false
            };
            db.ref("comments/" + key + "/replies").push(reply);
            Swal.fire("Successfully Replied!", "", "success");
            repliesForm.reply.value = "";
          }
        });

      // showing replies
      db.ref("comments/" + key + "/replies").on("value", (snap) => {
        document.querySelector(".replies").innerHTML = "";
        var repliesKey = [];
        snap.forEach((item, i) => {
          repliesKey.push(item.key);
          var time = item.val().time;
          time = time.split(" ");
          var userTime =
            time[1] + " " + time[2] + ", " + time[3] + " " + time[4];
          var edited = "";
          if (item.val().edited === true) edited = "Edited";
          var replyHtml = `
    <div class="reply-card">
      <div class="time">${getRelativeTime(userTime)}</div>
      <div class="username">${item.val().username}</div>
      <div class="comment">${item.val().comment}</div>
      <div class="edited">${edited}</div>
      <div class="tools">
      <div  class="edit-reply" id="${item.key}">
       <a class="modal-trigger" href="#edit-reply">Edit</a>
      </div>
      <div class="delete-reply" id="${item.key}">
      <a class="modal-trigger" href="#delete-reply">Delete</a>
      </div>
      </div>
    </div>
    `;

          document.querySelector(".replies").innerHTML += replyHtml;
        });

        if (repliesKey.length === 0)
          document.querySelector(
            ".replies"
          ).innerHTML = `<h5>No Replies...</h5>`;
        $(".replies-count").text("(" + repliesKey.length + ")");

        // Edit reply
        $(".edit-reply").on("click", function () {
          var key = $(this)[0].id;
          //console.log(key);
          const editForm = document.querySelector("#edit-reply-form");
          db.ref(
            "comments/" +
            localStorage.getItem("root-comment-key") +
            "/replies/" +
            key
          ).on("value", (snap) => {
            editForm.editBox.value = snap.val().comment;
          });

          $(".edit-reply-btn")
            .off()
            .on("click", function () {
              console.log(localStorage.getItem("root-comment-key"));
              db.ref(
                "comments/" +
                localStorage.getItem("root-comment-key") +
                "/replies/" +
                key
              ).update({
                comment: editForm.editBox.value,
                edited: true
              });
              Swal.fire("Successfully Edited!", "", "success");
            });
        });

        // Delete Reply
        $(".delete-reply").on("click", function () {
          var key = $(this)[0].id;
          $(".delete-reply-btn")
            .off()
            .on("click", function () {
              db.ref(
                "comments/" +
                localStorage.getItem("root-comment-key") +
                "/replies/" +
                key
              ).remove();
              Swal.fire("Successfully Deleted!", "", "success");
            });
        });
      });
    });

    //Replies Count
    items.forEach((item) => {
      db.ref("comments/" + item + "/replies").on("value", (snap) => {
        var replyKey = [];
        snap.forEach((reply) => {
          replyKey.push(reply.key);
        });
        $("#reply" + item).text("(" + replyKey.length + ")");
      });
    });
  },
  (error) => {
    console.log("Error");
  }
);

// moment js for time counting
function getRelativeTime(date) {
  const d = new Date(date);
  return moment(d).fromNow();
}

window.addEventListener("online", () => {
  $(".offline").hide();
  M.toast({
    html: "Back Online",
    classes: "rounded green"
  });
});

window.addEventListener("offline", () => {
  $(".offline").show();
  M.toast({
    html: "You are offline Now!",
    classes: "rounded red"
  });
});

$(document).ready(function () {
  $(".modal").modal();
});
/*card end*/

$(document).ready(function () {

  $(".primaryContained").on('click', function () {
    $(".comment").addClass("commentClicked");
  }); //end click
  $("textarea").on('keyup.enter', function () {
    $(".comment").addClass("commentClicked");
  }); //end keyup
}); //End Function

new Vue({
  el: "#app",
  data: {
    title: 'Add a comment',
    newItem: '',
    item: [],
  },
  methods: {
    addItem() {
      this.item.push(this.newItem);
      this.newItem = "";
    }
  }

});


ScrollReveal().reveal('.foto1', {delay:250});
ScrollReveal().reveal('.foto2', {delay:500});
ScrollReveal().reveal('.foto3', {delay:750});
ScrollReveal().reveal('.foto4', {delay:1000});
ScrollReveal().reveal('.foto5', {delay:1250});
ScrollReveal().reveal('.foto6', {delay:1500});
ScrollReveal().reveal('.foto7', {delay:1750});
ScrollReveal().reveal('.foto8', {delay:2000});
ScrollReveal().reveal('.foto9', {delay:2250});
/*************** */
   


