/*
Name: 			View - Shop
Written by: 	Okler Themes - (http://www.okler.net)
Theme Version:	12.1.0
*/

(($ => {
    /*
	* Quantity
	*/
    $( document ).on('click', '.quantity .plus',function(){
        const $qty=$(this).parents('.quantity').find('.qty');
        const currentVal = parseInt($qty.val());
        if (!isNaN(currentVal)) {
            $qty.val(currentVal + 1);
        }
    });

    $( document ).on('click', '.quantity .minus',function(){
        const $qty=$(this).parents('.quantity').find('.qty');
        const currentVal = parseInt($qty.val());
        if (!isNaN(currentVal) && currentVal > 1) {
            $qty.val(currentVal - 1);
        }
    });

    /*
    * Quick View Lightbox/Popup With Ajax
    */
    $('.quick-view').magnificPopup({
        type: 'ajax',
        fixedContentPos: true,
        fixedBgPos: true,
        overflowY: 'auto',
        closeBtnInside: true,
        preloader: false,
        midClick: true,
        removalDelay: 300,
        mainClass: '',
        callbacks: {
            open() {
                $('html').addClass('lightbox-opened');
            },
            close() {
                $('html').removeClass('lightbox-opened');
                setTimeout(() => {
                    $('html').removeClass('lightbox-beforeclose');
                }, 500);
            },
            beforeClose() {
                $('html').addClass('lightbox-beforeclose');
            },
            ajaxContentAdded() {

                /*
                Thumb Gallery
                */
                $('.thumb-gallery-wrapper').each(function(){
                    const $thumbGalleryDetail = $(this).find('.thumb-gallery-detail');
                    const $thumbGalleryThumbs = $(this).find('.thumb-gallery-thumbs');
                    let flag = false;
                    const duration = 300;

                    $thumbGalleryDetail
                        .owlCarousel({
                            items: 1,
                            margin: 10,
                            nav: true,
                            dots: false,
                            loop: false,
                            autoHeight: true,
                            navText: [],
                            rtl: ( $('html').attr('dir') == 'rtl' ) ? true : false
                        })
                        .on('changed.owl.carousel', ({item}) => {
                            if (!flag) {
                                flag = true;
                                $thumbGalleryThumbs.trigger('to.owl.carousel', [item.index-1, duration, true]);

                                $thumbGalleryThumbs.find('.owl-item').removeClass('selected');
                                $thumbGalleryThumbs.find('.owl-item').eq( item.index ).addClass('selected');
                                flag = false;
                            }
                        });


                    $thumbGalleryThumbs
                        .owlCarousel({
                            margin: 15,
                            items: $(this).data('thumbs-items') ? $(this).data('thumbs-items') : 4,
                            nav: false,
                            center: $(this).data('thumbs-center') ? true : false,
                            dots: false,
                            rtl: ( $('html').attr('dir') == 'rtl' ) ? true : false
                        })
                        .on('click', '.owl-item', function() {
                            $thumbGalleryDetail.trigger('to.owl.carousel', [$(this).index(), duration, true]);
                        })
                        .on('changed.owl.carousel', ({item}) => {
                            if (!flag) {
                                flag = true;
                                $thumbGalleryDetail.trigger('to.owl.carousel', [item.index, duration, true]);
                                flag = false;
                            }
                        });

                    $thumbGalleryThumbs.find('.owl-item').eq(0).addClass('selected');
                });

                /*
                * Star Rating
                */ 
                if ($.isFunction($.fn['themePluginStarRating'])) {

                    $(() => {
                        $('[data-plugin-star-rating]:not(.manual)').each(function() {
                            const $this = $(this);
                            let opts;

                            const pluginOptions = theme.fn.getOptions($this.data('plugin-options'));
                            if (pluginOptions)
                                opts = pluginOptions;

                            $this.themePluginStarRating(opts);
                        });
                    });

                }

            }
        }
    });
})).apply(this, [jQuery]);