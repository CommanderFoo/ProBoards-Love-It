class Love_It {

	static init(){
		if(typeof yootil == "undefined"){
			console.warn("The plugin \"Love It\" needs Yootil.");

			return;
		}

		this.PLUGIN_ID = "pd_love_it";
		this.PLUGIN_KEY = "pd_love_it";
		this.LOOKUP = new Map();

		this.IMAGES = {};
		this.SETTINGS = {};

		this.thread_check = (

			yootil.location.recent_posts() ||
			yootil.location.search_results() ||
			yootil.location.thread()

		);

		this.setup();

		$(this.ready.bind(this));
	}

	static ready(){
		if(this.thread_check){
			yootil.event.after_search(() => {

				this.create_elements.bind(this)();
				this.create_love_it_reactions.bind(this)();

			});

			this.create_elements();
			this.create_love_it_reactions();
		}
	}

	static setup(){
		let plugin = pb.plugin.get(this.PLUGIN_ID);

		if(plugin && plugin.settings){
			this.SETTINGS = plugin.settings;
			this.IMAGES = plugin.images;

			if(this.thread_check){
				let post_data = proboards.plugin.keys.data[this.PLUGIN_KEY];

				for(let key in post_data){
					this.LOOKUP.set(parseInt(key, 10), new Love_It_Post_Data(key, post_data[key]));
				}
			}
		}
	}

	static get_data(post_id){
		post_id = parseInt(post_id, 10);

		if(!this.LOOKUP.has(post_id)){
			this.LOOKUP.set(post_id, new Love_It_Post_Data(post_id));
		}

		return this.LOOKUP.get(post_id);
	}

	static create_elements(){
		let $posts = $("tr.item[id^=post-]");

		$posts.each(function(){
			let post_id = Love_It.fetch_post_id(this);
			let $content = $(this).find("td.content");

			if($content.length == 1 && post_id){
				let user_id = yootil.user.id();

				let data = Love_It.get_data(post_id);
				let opacity = (data.contains(user_id))? 1 : 0.3;
				let $container = $("<div data-love-it='" + post_id + "' class='love-it-container'></div>");
				let $info = $("<span data-love-it='" + post_id + "' class='love-it-info'></span>");
				let $button = $("<img data-love-it='" + post_id + "' class='love-it-button' />");

				$button.attr("src", Love_It.IMAGES.heart32);
				$button.css("opacity", opacity);

				$button.on("mouseover", () => {

					$button.css("opacity", 1);

				});

				$button.on("mouseout", () => {

					if(data.contains(user_id)){
						opacity = 1;
					} else {
						opacity = 0.3;
					}

					$button.css("opacity", opacity);

				});

				$button.on("click", Love_It.button_handler.bind($button, post_id, user_id));

				$container.append($info);
				$container.append($button);
				$content.append($container);
			}
		});
	}

	static button_handler(post_id, user_id){
		if(!yootil.key.write(Love_It.PLUGIN_KEY, post_id)){
			pb.window.alert("Permission Denied", "You do not have the permission to write to the key for the Love It! plugin.");
			return false;
		} else if(yootil.key.space_left(Love_It.PLUGIN_KEY) <= 35){
			pb.window.alert("Post Key Full", "Unfortunately your reaction cannot be saved for this post, as it is out of space.");
			return false;
		}

		let post_data = Love_It.get_data(post_id);
		let has_loved_it = (post_data && post_data.contains(user_id))? true : false;

		if(!has_loved_it){
			Love_It.add(post_id, user_id);
		} else {
			Love_It.remove(post_id, user_id);
		}

		return false;
	}

	static create_love_it_reactions(){
		this.LOOKUP.forEach((val, key, m) => {

			this.update_post(key);

		});
	}

	static add(post_id, user_id){
		$(".love-it-button[data-love-it='" + post_id + "']").css("opacity", 1);

		let post_data = Love_It.get_data(post_id);

		post_data.add(user_id, yootil.user.name());

		Love_It.update_post(post_id);
	}

	static remove(post_id, user_id){
		let post_data = Love_It.get_data(post_id);

		post_data.remove(user_id);

		this.update_post(post_id);

		$(".love-it-button[data-love-it='" + post_id + "']").css("opacity", .3);
	}

	static fetch_post_id(post){
		let post_id_parts = ($(post).attr("id") || "").split("-");

		if(post_id_parts && post_id_parts.length == 2){
			return parseInt(post_id_parts[1], 10);
		}

		return 0;
	}

	static update_post(post_id){
		let data = Love_It.get_data(post_id).data;
		let $info = $(".love-it-info[data-love-it='" + post_id + "']");

		if($info.length == 1){
			$info.empty();

			if(data.u.length > 0){
				let $elem = $("<span class='loved-it-loves'></span>");
				let html = "";

				if(data.l.length > 0){
					for(let i = 0; i < data.l.length; ++ i){
						let user_id = parseInt(data.l[i].u, 10);
						let name = yootil.html_encode(data.l[i].n, true);

						html += "<a href='/user/" + user_id + "' class='user-link js-user-link user-" + user_id + "' itemprop='url'><span itemprop='name'>" + name + "</span></a>";

						if(i < (data.l.length - 1)){
							html += ",";
						}

						html += " ";
					}
				}

				if(data.l.length == 0 && data.u.length > 0){
					html += data.u.length;
				} else if(data.u.length > data.l.length){
					html += "and " + (data.u.length - data.l.length) + " more";
				}

				html += " loves this";

				$elem.html(html);

				$info.append($elem);
			}
		}
	}

}