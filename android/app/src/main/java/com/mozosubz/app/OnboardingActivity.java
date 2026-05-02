package com.mozosubz.app;

import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Bundle;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.Button;
import android.widget.ImageView;
import android.widget.LinearLayout;
import android.widget.TextView;
import androidx.annotation.NonNull;
import androidx.appcompat.app.AppCompatActivity;
import androidx.recyclerview.widget.RecyclerView;
import androidx.viewpager2.widget.ViewPager2;
import java.util.ArrayList;
import java.util.List;

public class OnboardingActivity extends AppCompatActivity {

    private ViewPager2 viewPager;
    private LinearLayout dotsLayout;
    private Button btnNext;
    private Button btnSkip;

    private static final int[] SLIDE_TITLES = {
        R.string.onboard_title_1,
        R.string.onboard_title_2,
        R.string.onboard_title_3
    };
    private static final int[] SLIDE_DESCS = {
        R.string.onboard_desc_1,
        R.string.onboard_desc_2,
        R.string.onboard_desc_3
    };
    private static final int[] SLIDE_ICONS = {
        R.drawable.ic_onboard_subscription,
        R.drawable.ic_onboard_transfer,
        R.drawable.ic_onboard_security
    };

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_onboarding);

        viewPager = findViewById(R.id.viewPager);
        dotsLayout = findViewById(R.id.dotsLayout);
        btnNext = findViewById(R.id.btnNext);
        btnSkip = findViewById(R.id.btnSkip);

        List<OnboardSlide> slides = new ArrayList<>();
        for (int i = 0; i < SLIDE_TITLES.length; i++) {
            slides.add(new OnboardSlide(
                getString(SLIDE_TITLES[i]),
                getString(SLIDE_DESCS[i]),
                SLIDE_ICONS[i]
            ));
        }

        OnboardingAdapter adapter = new OnboardingAdapter(slides);
        viewPager.setAdapter(adapter);
        setupDots(0);

        viewPager.registerOnPageChangeCallback(new ViewPager2.OnPageChangeCallback() {
            @Override
            public void onPageSelected(int position) {
                setupDots(position);
                if (position == slides.size() - 1) {
                    btnNext.setText(getString(R.string.btn_get_started));
                    btnSkip.setVisibility(View.GONE);
                } else {
                    btnNext.setText(getString(R.string.btn_next));
                    btnSkip.setVisibility(View.VISIBLE);
                }
            }
        });

        btnNext.setOnClickListener(v -> {
            int current = viewPager.getCurrentItem();
            if (current < slides.size() - 1) {
                viewPager.setCurrentItem(current + 1, true);
            } else {
                finishOnboarding();
            }
        });

        btnSkip.setOnClickListener(v -> finishOnboarding());
    }

    private void setupDots(int currentPage) {
        dotsLayout.removeAllViews();
        int totalSlides = SLIDE_TITLES.length;
        for (int i = 0; i < totalSlides; i++) {
            View dot = new View(this);
            int size = (int) (8 * getResources().getDisplayMetrics().density);
            int margin = (int) (4 * getResources().getDisplayMetrics().density);
            LinearLayout.LayoutParams params = new LinearLayout.LayoutParams(size, size);
            params.setMargins(margin, 0, margin, 0);
            dot.setLayoutParams(params);
            dot.setBackgroundResource(i == currentPage
                ? R.drawable.dot_active
                : R.drawable.dot_inactive);
            dotsLayout.addView(dot);
        }
    }

    private void finishOnboarding() {
        SharedPreferences prefs = getSharedPreferences("mozosubz_prefs", MODE_PRIVATE);
        prefs.edit().putBoolean("onboarding_done", true).apply();
        startActivity(new Intent(this, MainActivity.class));
        finish();
    }

    static class OnboardSlide {
        String title, desc;
        int iconRes;
        OnboardSlide(String title, String desc, int iconRes) {
            this.title = title;
            this.desc = desc;
            this.iconRes = iconRes;
        }
    }

    static class OnboardingAdapter extends RecyclerView.Adapter<OnboardingAdapter.SlideViewHolder> {
        private final List<OnboardSlide> slides;

        OnboardingAdapter(List<OnboardSlide> slides) {
            this.slides = slides;
        }

        @NonNull
        @Override
        public SlideViewHolder onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
            View view = LayoutInflater.from(parent.getContext())
                .inflate(R.layout.item_onboard_slide, parent, false);
            return new SlideViewHolder(view);
        }

        @Override
        public void onBindViewHolder(@NonNull SlideViewHolder holder, int position) {
            OnboardSlide slide = slides.get(position);
            holder.title.setText(slide.title);
            holder.desc.setText(slide.desc);
            holder.icon.setImageResource(slide.iconRes);
        }

        @Override
        public int getItemCount() { return slides.size(); }

        static class SlideViewHolder extends RecyclerView.ViewHolder {
            TextView title, desc;
            ImageView icon;
            SlideViewHolder(@NonNull View itemView) {
                super(itemView);
                title = itemView.findViewById(R.id.slideTitle);
                desc = itemView.findViewById(R.id.slideDesc);
                icon = itemView.findViewById(R.id.slideIcon);
            }
        }
    }
}
