const queryall = (selector, parent = document) =>
  Array.from(parent.querySelectorAll(selector));
const queryone = (selector, parent = document) =>
  parent.querySelector(selector) || parent.createElement('div');

const queryid = selector =>
  document.getElementById(selector) || document.createElement('div');
const loadYT = () => {
  const tag = document.createElement('script');
  tag.src = 'https://www.youtube.com/iframe_api';
  const firstScriptTag = document.getElementsByTagName('script')[0];
  firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
};
const stories = (data = null, seekbars = null, uid = 0) => {
  if (data === null) {
    let bars = document.createElement('div');
    bars.classList.add('seek-bars');
    bars.innerHTML = seekbars
      .map(b => "<div class='seek'><div class='seeker'></div></div>")
      .join('');
    return bars;
  }
  let stories = document.createElement('section');
  stories.classList.add('rkgttr-stories-container');
  stories.classList.add('stories-swiper');
  stories.setAttribute('id', uid);
  stories.innerHTML = `<div class='stories swiper-wrapper'>${data
    .map(
      (story, i) => `
      <div class="swiper-slide story-container${
        i === 0 ? ' current-story' : ''
      }">
        <div class="bgd"></div>
        <div class="multi"><div></div></div>
        <div class="story" id="story${uid}${i}"></div>
        <div class="subs"></div>
        <div class='controls'></div>
      </div>
     `
    )
    .join('')}<div class="story-container empty"></div></div>
  <button type="button" class="close"><svg class="icon" viewBox="0 0 24 24"><path d="M17.59 5L12 10.59L6.41 5L5 6.41L10.59 12L5 17.59L6.41 19L12 13.41L17.59 19L19 17.59L13.41 12L19 6.41L17.59 5Z"></path></svg></button>`;
  return stories;
};
const initStories = () => {
  if (queryall('.rkgttr-stories-bar').length) {
    (async () => {
      const Swiper = await import(
        'https://cdn.jsdelivr.net/npm/swiper@9/swiper-bundle.esm.browser.min.js'
      );
      const { gsap } = await import('https://cdn.skypack.dev/gsap');

      if (!window.hasOwnProperty('YT')) {
        loadYT();
      }
      (async () => {
        while (!window.hasOwnProperty('YT')) {
          await new Promise(resolve => setTimeout(resolve, 200));
        }
        await new Promise(resolve => setTimeout(resolve, 200));
        queryall('.rkgttr-stories-bar').forEach(storiesScope => {
          new Swiper.default(storiesScope, {
            slidesPerView: 'auto',
            spaceBetween: 30,
          });
          const uid = '_' + Math.round(Math.random() * 10000);
          document.body.appendChild(
            stories(
              queryall('button.story', storiesScope).map(s =>
                s.getAttribute('data-story')
              ),
              null,
              uid
            )
          );
          const scope = queryid(uid);
          let timecontrol,
            currentlyPlaying = null;
          const storiesArray = [];
          const StoriesSwiper = new Swiper.default(scope, {
            centeredSlides: true,
            slidesPerView: 'auto',
            on: {
              slideChange: e => {
                playStory(e.activeIndex);
              },
            },
          });

          const playStory = i => {
            if (currentlyPlaying) {
              currentlyPlaying.playVideoAt(0);
              currentlyPlaying.stopVideo();
            }
            storiesArray[i].btn.blur();
            if (queryall('.current-story', scope).length)
              queryone('.current-story', scope).classList.remove(
                'current-story'
              );
            currentlyPlaying = storiesArray[i].player;
            currentlyPlaying.playVideoAt(0);
            currentlyPlaying.playVideo();
            storiesArray[i].story.classList.add('current-story');
            timecontrol = setInterval(checkTime, 100);
          };

          const checkTime = () => {
            if (currentlyPlaying) {
              const time = currentlyPlaying.getCurrentTime();
              const ratio = time / currentlyPlaying.getDuration();
              const playlistItem = currentlyPlaying.getPlaylistIndex();
              let text = '';
              currentlyPlaying.subs[playlistItem].forEach(sub => {
                if (time >= sub.start && time <= sub.end) {
                  text = sub.text;
                }
              });
              currentlyPlaying.subsLayer.textContent = text;
              queryall('.seeker', currentlyPlaying.controlLayer).forEach(
                (seek, i) => {
                  if (i < playlistItem) {
                    gsap.set(seek, { scaleX: 1 });
                  } else if (i === playlistItem) {
                    gsap.set(seek, { scaleX: ratio });
                  } else {
                    gsap.set(seek, { scaleX: 0.0001 });
                  }
                }
              );
            }
          };

          queryone('.close', scope).addEventListener('click', e => {
            currentlyPlaying.playVideoAt(0);
            currentlyPlaying.stopVideo();
            clearInterval(timecontrol);
            currentlyPlaying = null;
            gsap.to(scope, {
              alpha: 0,
              duration: 0.3,
              onComplete: () => scope.classList.remove('shown'),
            });
          });

          const nextStories = (dir = 1) => {
            currentlyPlaying.playVideoAt(0);
            currentlyPlaying.stopVideo();
            if (
              currentlyPlaying.storyId + dir === storiesArray.length ||
              currentlyPlaying.storyId + dir === -1
            ) {
              gsap.to(scope, {
                alpha: 0,
                duration: 0.3,
                onComplete: () => {
                  scope.classList.remove('shown');
                  clearInterval(timecontrol);
                  currentlyPlaying = null;
                  queryone('.current-story', scope).classList.remove(
                    'current-story'
                  );
                },
              });
            } else {
              StoriesSwiper.slideTo(currentlyPlaying.storyId + dir);
            }
          };

          window.YT.ready(() => {
            queryall('button.story', storiesScope).forEach((storybtn, i) => {
              const id = Math.round(Math.random() * 10000);
              storiesArray.push({
                story: queryall('.stories .story-container', scope)[i],
                btn: storybtn,
                controls: queryone(
                  '.controls',
                  queryone('#story' + uid + i, scope).parentNode
                ),
                player: new YT.Player('story' + uid + i, {
                  height: '390',
                  width: '640',
                  host: 'https://www.youtube.com',
                  origin: window.location.origin,
                  playerVars: {
                    listType: 'playlist',
                    list: storybtn.getAttribute('data-story'),
                    modestbranding: 1,
                    playsinline: 1,
                    loop: 0,
                    controls: 0,
                    showinfo: 0,
                    rel: 0,
                  },
                  events: {
                    onReady: e => {
                      e.target.setLoop(false);
                      e.target.controlLayer = queryone(
                        '.controls',
                        queryone('#story' + uid + i).parentNode
                      );
                      e.target.subsLayer = queryone(
                        '.subs',
                        queryone('#story' + uid + i).parentNode
                      );
                      e.target.storyId = i;
                      e.target.controlLayer.style.backgroundImage = `url('https://img.youtube.com/vi/${
                        e.target.getPlaylist()[0]
                      }/maxresdefault.jpg')`;
                      e.target.controlLayer.parentNode.querySelector(
                        '.bgd'
                      ).style.backgroundImage = `url('https://img.youtube.com/vi/${
                        e.target.getPlaylist()[0]
                      }/sddefault.jpg')`;
                      e.target.controlLayer.appendChild(
                        stories(null, e.target.getPlaylist())
                      );
                      e.target.subs = e.target.getPlaylist().map(id => []);
                      if (queryone('html').getAttribute('lang') === 'en') {
                        e.target.getPlaylist().forEach((pl, i) =>
                          loadSubs(pl, i).then(subs => {
                            e.target.subs[subs.index] = subs.subs;
                            storiesArray[e.target.storyId].btn.classList.add(
                              'loaded'
                            );
                          })
                        );
                      } else {
                        storiesArray[e.target.storyId].btn.classList.add(
                          'loaded'
                        );
                      }

                      storiesArray[e.target.storyId].btn.addEventListener(
                        'click',
                        event => {
                          if (
                            storiesArray[
                              e.target.storyId
                            ].btn.classList.contains('loaded')
                          ) {
                            scope.classList.add('shown');
                            gsap.fromTo(
                              scope,
                              { alpha: 0 },
                              { alpha: 1, duration: 0.3 }
                            );
                            if (
                              StoriesSwiper.activeIndex !== e.target.storyId
                            ) {
                              StoriesSwiper.slideTo(e.target.storyId);
                            } else {
                              playStory(e.target.storyId);
                            }
                          }
                        }
                      );
                    },
                    onStateChange: e => {
                      if (
                        e.data === 0 &&
                        currentlyPlaying.storyId === e.target.storyId
                      ) {
                        nextStories();
                      }
                      if (e.data === 1) {
                        currentlyPlaying.controlLayer.classList.add('p');
                      }
                      if (e.data === 3) {
                        queryone('.current-story iframe', scope).classList.add(
                          'hidden'
                        );
                      } else {
                        queryone(
                          '.current-story iframe',
                          scope
                        ).classList.remove('hidden');
                      }
                    },
                  },
                }),
              });

              storiesArray[i].controls.addEventListener('click', e => {
                if (storiesArray[i].story.classList.contains('current-story')) {
                  if (
                    storiesArray[i].player.getPlaylistIndex() <
                    storiesArray[i].player.getPlaylist().length - 1
                  ) {
                    storiesArray[i].player.nextVideo();
                  } else {
                    nextStories();
                  }
                } else {
                  StoriesSwiper.slideTo(i);
                }
              });
            });
          });
        });
      })();
    })();
  }
};
initStories();
