/*
Name: 			Elements - Image Gallery - Examples
Written by: 	Okler Themes - (http://www.okler.net)
Theme Version:	12.1.0
*/
(($ => {
    /*
	Thumb Gallery
	*/
    theme.fn.intObs( '.thumb-gallery-wrapper', function(){
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
    }, {});
})).apply(this, [jQuery]);