/*
Name: 			Portfolio - Examples
Written by: 	Okler Themes - (http://www.okler.net)
Theme Version:	12.1.0
*/
(($ => {
    /*
	Portfolio on Modal
	*/
    $('a[data-portfolio-on-modal]').magnificPopup({
		mainClass: 'portfolio-modal',
		type: 'inline',
		gallery: {
			enabled: true
		},
		callbacks: {
		  	open() {
		  		$('.owl-carousel').owlCarousel('refresh');
		  	},
		  	change() {
		  		setTimeout(() => {
			  		$('.owl-carousel').owlCarousel('refresh');
		  		}, 1);
		  	}
		}
	});

    $('a[data-portfolio-close]').on('click', e => {
		e.preventDefault();
		$.magnificPopup.instance.close();
		return false;
	});

    $('a[data-portfolio-prev]').on('click', e => {
		e.preventDefault();
		$.magnificPopup.instance.prev();
		return false;
	});

    $('a[data-portfolio-next]').on('click', e => {
		e.preventDefault();
		$.magnificPopup.instance.next();
		return false;
	});

    /*
	Carousel
	*/
    if ($.isFunction($.fn.revolution)) {
		$("#revolutionSliderCarousel").show().revolution({
			sliderType: "carousel",
			sliderLayout: "fullwidth",
			dottedOverlay: "none",
			delay: 4000,
			navigation: {
				keyboardNavigation: "off",
				keyboard_direction: "horizontal",
				mouseScrollNavigation: "off",
				onHoverStop: "off",
				arrows: {
					style: "tparrows-carousel",
					enable: true,
					hide_onmobile: false,
					hide_onleave: false,
					tmp: '',
					left: {
						h_align: "left",
						v_align: "center",
						h_offset: 30,
						v_offset: 0
					},
					right: {
						h_align: "right",
						v_align: "center",
						h_offset: 30,
						v_offset: 0
					}
				}
			},
			carousel: {
				maxRotation: 65,
				vary_rotation: "on",
				minScale: 55,
				vary_scale: "off",
				horizontal_align: "center",
				vertical_align: "center",
				fadeout: "on",
				vary_fade: "on",
				maxVisibleItems: 5,
				infinity: "on",
				space: -150,
				stretch: "off"
			},
			gridwidth: 600,
			gridheight: 600,
			lazyType: "none",
			shadow: 0,
			spinner: "off",
			stopLoop: "on",
			stopAfterLoops: 0,
			stopAtSlide: -1,
			shuffle: "off",
			autoHeight: "off",
			disableProgressBar: "on",
			hideThumbsOnMobile: "off",
			hideSliderAtLimit: 0,
			hideCaptionAtLimit: 0,
			hideAllCaptionAtLilmit: 0,
			debugMode: false,
			fallbacks: {
				simplifyAll: "off",
				nextSlideOnWindowFocus: "off",
				disableFocusListener: false,
			}
		});
	}

    /*
	Medias
	*/
    if ($.isFunction($.fn.revolution)) {
		$("#revolutionSliderMedias").show().revolution({
			sliderType: "standard",
			sliderLayout: "auto",
			dottedOverlay: "none",
			delay: 9000,
			navigation: {
				keyboardNavigation: "off",
				keyboard_direction: "horizontal",
				mouseScrollNavigation: "off",
				onHoverStop: "off",
				tabs: {
					style: "hesperiden hesperiden-custom",
					enable: true,
					width: 250,
					height: 80,
					min_width: 250,
					wrapper_padding: 20,
					wrapper_color: "#ffffff",
					wrapper_opacity: "1",
					tmp: '<div class="tp-tab-content">  <span class="tp-tab-date">{{param1}}</span>  <span class="tp-tab-title">{{title}}</span></div><div class="tp-tab-image"></div>',
					visibleAmount: 5,
					hide_onmobile: false,
					hide_onleave: false,
					hide_delay: 200,
					direction: "horizontal",
					span: false,
					position: "outer-bottom",
					space: 0,
					h_align: "left",
					v_align: "bottom",
					h_offset: 0,
					v_offset: 0
				}
			},
			gridwidth: 1230,
			gridheight: 692,
			lazyType: "smart",
			shadow: 0,
			spinner: "off",
			stopLoop: "on",
			stopAfterLoops: 0,
			stopAtSlide: 1,
			shuffle: "off",
			autoHeight: "off",
			disableProgressBar: "on",
			hideThumbsOnMobile: "off",
			hideSliderAtLimit: 0,
			hideCaptionAtLimit: 0,
			hideAllCaptionAtLilmit: 0,
			debugMode: false,
			fallbacks: {
				simplifyAll: "off",
				nextSlideOnWindowFocus: "off",
				disableFocusListener: false,
			}
		});
	}

    /*
	Ajax on Page
	*/
    const ajaxOnPage = {

		pages: [],
		currentPage: 0,
		total: 0,
		$ajaxBox: $('#porfolioAjaxBox'),
		$ajaxBoxContent: $('#porfolioAjaxBoxContent'),

		build() {

			const self = this;

			$('a[data-ajax-on-page]').each(function() {
				self.add($(this));
			});

			$(document).on('mousedown', 'a[data-ajax-on-page]', ev => {
				if (ev.which == 2) {
					ev.preventDefault();
					return false;
				}
			});

			// Key Press
			$(document.documentElement).on('keyup', ({keyCode}) => {

				if( !$('.mfp-wrap').get(0) ) {

					// Next
					if (keyCode == 39) {
						self.next();
					}

					// Prev
					if (keyCode == 37) {
						self.prev();
					}

				}

			});

		},

		add($el) {

			const self = this, href = $el.attr('data-href');

			self.pages.push(href);
			self.total++;

			$el.on('click', e => {
				e.preventDefault();
				self.show(self.pages.indexOf(href));
			});

		},

		events() {

			const self = this;

			// Close
			$('a[data-ajax-portfolio-close]').on('click', e => {
				e.preventDefault();
				self.close();
			});

			if (self.total <= 1) {

				$('a[data-ajax-portfolio-prev], a[data-ajax-portfolio-next]').remove();

			} else {

				// Prev
				$('a[data-ajax-portfolio-prev]').on('click', e => {
					e.preventDefault();
					self.prev();
				});

				// Next
				$('a[data-ajax-portfolio-next]').on('click', e => {
					e.preventDefault();
					self.next();
				});

			}

			// Carousel
			if ($.isFunction($.fn['themePluginCarousel'])) {

				$(() => {
					$('[data-plugin-carousel]:not(.manual), .owl-carousel:not(.manual)').each(function() {
                        const $this = $(this);
                        let opts;

                        const pluginOptions = theme.fn.getOptions($this.data('plugin-options'));
                        if (pluginOptions)
							opts = pluginOptions;

                        $this.themePluginCarousel(opts);
                    });
				});

			}

		},

		close() {

			const self = this;

			self.$ajaxBoxContent.empty();
			self.$ajaxBox.removeClass('ajax-box-init').removeClass('ajax-box-loading');

		},

		next() {

			const self = this;

			if(self.currentPage + 1 < self.total) {
				self.show(self.currentPage + 1);
			} else {
				self.show(0);
			}
		},

		prev() {

			const self = this;

			if((self.currentPage - 1) >= 0) {
				self.show(self.currentPage - 1);
			} else {
				self.show(self.total - 1);
			}
		},

		show(i) {

			const self = this;

			self.$ajaxBoxContent.empty();
			self.$ajaxBox.removeClass('ajax-box-init').addClass('ajax-box-loading');

			$('html, body').animate({
				scrollTop: self.$ajaxBox.offset().top - 100
			}, 300, 'easeOutQuad');

			self.currentPage = i;

			if (i < 0 || i > (self.total-1)) {
				self.close();
				return false;
			}

			// Ajax
			$.ajax({
				url: self.pages[i],
				cache: false,
				complete({responseText}) {
				
					setTimeout(() => {

						self.$ajaxBoxContent.html(responseText).append('<div class="row"><div class="col-md-12"><hr class="tall mt-4"></div></div>');
						self.$ajaxBox.removeClass('ajax-box-loading');

						self.events();

					}, 1000);

				}
			});

		}

	};

    if($('#porfolioAjaxBox').get(0)) {
		ajaxOnPage.build();
	}

    /*
	Ajax on Modal
	*/
    theme.fn.execOnceTroughEvent( 'a[data-ajax-on-modal]', 'mouseover.trigger.ajax.on.modal', () => {
		$('a[data-ajax-on-modal]').magnificPopup({
			type: 'ajax',
			tLoading: '',
			mainClass: 'portfolio-ajax-modal',
			closeBtnInside: true,
			gallery: {
				enabled: true
			},
			callbacks: {
				ajaxContentAdded() {

					// Wrapper
					const $wrapper = $('.portfolio-ajax-modal');

					// Close
					$wrapper.find('a[data-ajax-portfolio-close]').on('click', e => {
						e.preventDefault();
						$.magnificPopup.close();
					});

					// Remove Next and Close
					if($('a[data-ajax-on-modal]').length <= 1) {
						
						$wrapper.find('a[data-ajax-portfolio-prev], a[data-ajax-portfolio-next]').remove();

					} else {

						// Prev
						$wrapper.find('a[data-ajax-portfolio-prev]').on('click', e => {
							e.preventDefault();
							$('.mfp-arrow-left').trigger('click');
							return false;
						});

						// Next
						$wrapper.find('a[data-ajax-portfolio-next]').on('click', e => {
							e.preventDefault();
							$('.mfp-arrow-right').trigger('click');
							return false;
						});

					}

					// Carousel
					$(() => {
						$('[data-plugin-carousel]:not(.manual), .owl-carousel:not(.manual)').each(function() {
                            const $this = $(this);
                            let opts;

                            const pluginOptions = theme.fn.getOptions($this.data('plugin-options'));
                            if (pluginOptions)
								opts = pluginOptions;

                            $this.themePluginCarousel(opts);
                        });
					});

				}
			}
		});
	});

    /*
	Load More
	*/
    const portfolioLoadMore = {

		pages: 0,
		currentPage: 1,
		$wrapper: $('#portfolioLoadMoreWrapper'),
		$btn: $('#portfolioLoadMore'),
		$btnWrapper: $('#portfolioLoadMoreBtnWrapper'),
		$loader: $('#portfolioLoadMoreLoader'),

		build() {

			const self = this;

			self.pages = self.$wrapper.data('total-pages');

			if(self.pages <= 1) {

				self.$btnWrapper.remove();
				return;

			} else {

				self.$btn.on('click', () => {
					self.loadMore();
				});

				// Infinite Scroll
				if(self.$btn.hasClass('btn-portfolio-infinite-scroll')) {
					theme.fn.intObs( '#portfolioLoadMore', "$('#portfolioLoadMore').trigger('click');", {
						rootMargin: '0px 0px 0px 0px'
					}, true );
				}

			}

		},
		loadMore() {

			const self = this, ajax_url = ( self.$wrapper.data('ajax-url') ) ? self.$wrapper.data('ajax-url') : 'ajax/portfolio-ajax-load-more-';

			self.$btn.hide();
			self.$loader.addClass('portfolio-load-more-loader-showing').show();

			// Ajax
			$.ajax({
				url: ajax_url + (parseInt(self.currentPage)+1) + '.html',
				complete({responseText}) {

					const $items = $(responseText);

					setTimeout(() => {

						self.$wrapper.append($items)

						self.$wrapper.isotope('appended', $items);

						self.currentPage++;

						if(self.currentPage < self.pages) {
							self.$btn.show().blur();
						} else {
							self.$btnWrapper.remove();
						}

						// Carousel
						$(() => {
							$('[data-plugin-carousel]:not(.manual), .owl-carousel:not(.manual)').each(function() {
                                const $this = $(this);
                                let opts;

                                const pluginOptions = theme.fn.getOptions($this.data('plugin-options'));
                                if (pluginOptions)
									opts = pluginOptions;

                                $this.themePluginCarousel(opts);
                            });
						});

						self.$loader.removeClass('portfolio-load-more-loader-showing').hide();

						self.$wrapper.waitForImages(() => {
							self.$wrapper.isotope('layout');
						});

					}, 1000);

				}
			});

		}

	};

    if($('#portfolioLoadMoreWrapper').get(0)) {
		portfolioLoadMore.build();
	}

    /*
	Pagination
	*/
    const portfolioPagination = {

		pages: 0,
		$wrapper: $('#portfolioPaginationWrapper'),
		$filter: $('#portfolioPaginationFilter'),
		$pager: $('#portfolioPagination'),

		init() {

			const self = this;

			self.$filter.on('filtered', (event, laidOutItems) => {
				self.build();
				self.$filter.find('.active').trigger('click');
			});

		},

		calcPages() {

			const self = this, filter = self.$wrapper.attr('data-filter'), itemsPerPage = parseInt(self.$wrapper.attr('data-items-per-page')), $activeItems = self.$wrapper.find(filter + '.isotope-item');

			self.$wrapper.find('.isotope-item').removeAttr('data-page-rel');

			$activeItems.each(function(i) {
				const itemPage = Math.ceil((i+1)/itemsPerPage);

				$(this).attr('data-page-rel', ((itemPage == 0) ? 1 : itemPage));

				if (itemPage > 1) {
					$(this).hide();
				}
			});

			self.$wrapper.isotope('layout');

			return Math.ceil($activeItems.length/itemsPerPage);
		},

		build() {

			const self = this;

			self.pages = self.calcPages();

			self.$wrapper.removeAttr('data-current-page');

			self.$pager.empty().unbind();

			if(self.pages <= 1) {

				return;

			} else {

				self.$wrapper.attr('data-current-page', 1);

				self.$pager.bootpag({
					total: self.pages,
					page: 1,
					next: '<i class="fas fa-angle-right"></i>',
					prev: '<i class="fas fa-angle-left"></i>'
				}).on('page', (event, num) => {
					self.$wrapper.attr('data-current-page', num);
					self.$filter.find('.active').trigger('click');
				});

			}

			self.$filter.find('.active').trigger('click');

			self.$pager.find('li').addClass('page-item');
			self.$pager.find('a').addClass('page-link');

		}

	};

    if($('#portfolioPagination').get(0)) {
		portfolioPagination.init();
	}

    /*
	Combination Filters
	*/
    if($('#combinationFilters').get(0)) {

		$(window).on('load', () => {

			setTimeout(() => {

				const $grid = $('.portfolio-list').isotope({
					itemSelector: '.isotope-item',
					layoutMode: 'masonry',
					filter: '*',
					hiddenStyle: {
						opacity: 0
					},
					visibleStyle: {
						opacity: 1
					},
					stagger: 30,
					isOriginLeft: ($('html').attr('dir') == 'rtl' ? false : true)
				});

				const filters = {}, $loader = $('.sort-destination-loader');

				$('.filters').on('click', 'a', function(e) {
					
					e.preventDefault();
					
					const $this = $(this);

					const $buttonGroup = $this.parents('.portfolio-filter-group');
					const filterGroup = $buttonGroup.attr('data-filter-group');
					
					filters[filterGroup] = $this.parent().attr('data-option-value');
					
					const filterValue = concatValues(filters);
					
					$grid.isotope({
						filter: filterValue
					});
				});

				$('.portfolio-filter-group').each((i, buttonGroup) => {
					const $buttonGroup = $(buttonGroup);
					$buttonGroup.on('click', 'a', function() {
						$buttonGroup.find('.active').removeClass('active');
						$(this).parent().addClass('active');
						$(this).addClass('active');
					});
				});

				var concatValues = obj => {
					let value = '';
					for (const prop in obj) {
						value += obj[prop];
					}
					return value;
				}

				$(window).on('resize', () => {
					setTimeout(() => {
						$grid.isotope('layout');
					}, 300);
				});

				if ($loader) {
					$loader.removeClass('sort-destination-loader-showing');

					setTimeout(() => {
						$loader.addClass('sort-destination-loader-loaded');
					}, 500);
				}

			}, 1000);

		});

	}

    /*
	Lazy Load Masonry
	*/
    if($('#portfolioLazyLoadMasonry').get(0)) {

		const $window = $(window);

		$window.on('load', () => {

			const $grid = $('#portfolioLazyLoadMasonry .portfolio-list').isotope({
				itemSelector: '.isotope-item',
				layoutMode: 'masonry',
				filter: '*',
				hiddenStyle: {
					opacity: 0
				},
				visibleStyle: {
					opacity: 1
				},
				stagger: 30,
				isOriginLeft: ($('html').attr('dir') == 'rtl' ? false : true)
			});

			let runningIsotope = false;

			function reLayouIsotope() {

				if(!runningIsotope) {

					$grid.isotope('layout');
					runningIsotope = true;

					setTimeout(() => {
						runningIsotope = false;
					}, 1000);

				}

			}

			$grid.isotope('on', 'layoutComplete', () => {
				reLayouIsotope();
			});

			$window.on('scroll', () => {
				reLayouIsotope();
			});

			$window.on('resize', () => {
				setTimeout(() => {
					reLayouIsotope();
				}, 300);
			});

		});

	}
})).apply(this, [jQuery]);