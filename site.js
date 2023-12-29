
  function changePage(pageId){
    document.location.hash = "#" + pageId
  }
  function showPage(pageId){
    $(".page").hide();
    $(".preview").show();
    document.body.scrollTop = document.documentElement.scrollTop = 0;
    setTimeout(function(){showPageReally(pageId)},1);
  }

  function showPageReally(pageId){
    $(pageId).show();
    console.log(pageId + "Preview");
    $(pageId + "Preview").hide();
  }
  

  $(function(){
    
    $('.accordion-item').on('shown.bs.collapse', function () {
      this.scrollIntoView();  
    });

    $(window).on('hashchange', function (e) {
      showPage(location.hash);
    });
    
    if (window.location.hash) {
        $(window).trigger('hashchange')
    }else {
      window.location.hash = "intro"
    }

  });
  