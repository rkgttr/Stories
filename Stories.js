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
    bars.classList.add('rkgttr-seek-bars');
    bars.innerHTML = seekbars
      .map(
        b => "<div class='rkgttr-seek'><div class='rkgttr-seeker'></div></div>"
      )
      .join('');
    return bars;
  }
  let stories = document.createElement('section');
  stories.classList.add('rkgttr-stories-container');
  stories.classList.add('stories-swiper');
  stories.setAttribute('id', uid);
  stories.innerHTML = `<div class='rkgttr-stories swiper-wrapper'>${data
    .map(
      (story, i) => `
      <div class="swiper-slide rkgttr-story-container${
        i === 0 ? ' rkgttr-current-story' : ''
      }">
        <div class="rkgttr-bgd"></div>
        <div class="rkgttr-story" id="story${uid}${i}"></div>
        <div class='rkgttr-controls'></div>
      </div>
     `
    )
    .join('')}<div class="rkgttr-story-container rkgttr-empty"></div></div>
  <button type="button" class="rkgttr-close"><svg class="rkgttr-icon" viewBox="0 0 24 24"><path d="M17.59 5L12 10.59L6.41 5L5 6.41L10.59 12L5 17.59L6.41 19L12 13.41L17.59 19L19 17.59L13.41 12L19 6.41L17.59 5Z"></path></svg></button>`;
  return stories;
};
const initStories = () => {
  if (queryall('.rkgttr-stories-bar').length) {
    (async () => {
      const Swiper = await import(
        'https://cdn.jsdelivr.net/npm/swiper@9/swiper-bundle.esm.browser.min.js'
      );
      const { gsap } = await import('https://cdn.skypack.dev/gsap@3.11.4');

      if (!window.hasOwnProperty('YT')) {
        loadYT();
      }
      (async () => {
        while (!window.hasOwnProperty('YT')) {
          await new Promise(resolve => setTimeout(resolve, 200));
        }
        await new Promise(resolve => setTimeout(resolve, 200));
        queryall('.rkgttr-stories-bar').forEach(storiesScope => {
          if(!storiesScope.classList.contains('no-swiper')) {
            new Swiper.default(storiesScope, {
              slidesPerView: 'auto',
              spaceBetween: 0,
            });
          }
          const uid = '_' + Math.round(Math.random() * 10000);
          document.body.appendChild(
            stories(
              queryall('button.rkgttr-story', storiesScope).map(s =>
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
            if (queryall('.rkgttr-current-story', scope).length)
              queryone('.rkgttr-current-story', scope).classList.remove(
                'rkgttr-current-story'
              );
            currentlyPlaying = storiesArray[i].player;
            currentlyPlaying.playVideoAt(0);
            currentlyPlaying.playVideo();
            storiesArray[i].story.classList.add('rkgttr-current-story');
            timecontrol = setInterval(checkTime, 100);
          };

          const checkTime = () => {
            if (currentlyPlaying) {
              const time = currentlyPlaying.getCurrentTime();
              const ratio = time / currentlyPlaying.getDuration();
              const playlistItem = currentlyPlaying.getPlaylistIndex();

              queryall('.rkgttr-seeker', currentlyPlaying.controlLayer).forEach(
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

          queryone('.rkgttr-close', scope).addEventListener('click', e => {
            currentlyPlaying.playVideoAt(0);
            currentlyPlaying.stopVideo();
            clearInterval(timecontrol);
            currentlyPlaying = null;
            gsap.to(scope, {
              alpha: 0,
              duration: 0.3,
              onComplete: () => scope.classList.remove('rkgttr-shown'),
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
                  scope.classList.remove('rkgttr-shown');
                  clearInterval(timecontrol);
                  currentlyPlaying = null;
                  queryone('.rkgttr-current-story', scope).classList.remove(
                    'rkgttr-current-story'
                  );
                },
              });
            } else {
              StoriesSwiper.slideTo(currentlyPlaying.storyId + dir);
            }
          };

          window.YT.ready(() => {
            queryall('button.rkgttr-story', storiesScope).forEach(
              (storybtn, i) => {
                const id = Math.round(Math.random() * 10000);
                storiesArray.push({
                  story: queryall(
                    '.rkgttr-stories .rkgttr-story-container',
                    scope
                  )[i],
                  btn: storybtn,
                  controls: queryone(
                    '.rkgttr-controls',
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
                          '.rkgttr-controls',
                          queryone('#story' + uid + i).parentNode
                        );

                        e.target.storyId = i;
                        e.target.controlLayer.style.backgroundImage = `url('https://img.youtube.com/vi/${
                          e.target.getPlaylist()[0]
                        }/maxresdefault.jpg')`;
                        e.target.controlLayer.parentNode.querySelector(
                          '.rkgttr-bgd'
                        ).style.backgroundImage = `url('https://img.youtube.com/vi/${
                          e.target.getPlaylist()[0]
                        }/sddefault.jpg')`;
                        e.target.controlLayer.appendChild(
                          stories(null, e.target.getPlaylist())
                        );

                        storiesArray[e.target.storyId].btn.classList.add(
                          'rkgttr-loaded'
                        );

                        storiesArray[e.target.storyId].btn.addEventListener(
                          'click',
                          event => {
                            if (
                              storiesArray[
                                e.target.storyId
                              ].btn.classList.contains('rkgttr-loaded')
                            ) {
                              scope.classList.add('rkgttr-shown');
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
                          currentlyPlaying.controlLayer.classList.add(
                            'rkgttr-p'
                          );
                        }
                        if (e.data === 3) {
                          queryone(
                            '.rkgttr-current-story iframe',
                            scope
                          ).classList.add('rkgttr-hidden');
                        } else {
                          queryone(
                            '.rkgttr-current-story iframe',
                            scope
                          ).classList.remove('rkgttr-hidden');
                        }
                      },
                    },
                  }),
                });

                storiesArray[i].controls.addEventListener('click', e => {
                  if (
                    storiesArray[i].story.classList.contains(
                      'rkgttr-current-story'
                    )
                  ) {
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
              }
            );
          });
        });
      })();
    })();
  }
};
initStories();
