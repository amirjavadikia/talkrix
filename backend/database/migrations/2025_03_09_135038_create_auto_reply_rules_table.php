<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('auto_reply_rules', function (Blueprint $table) {
            $table->id();
            $table->foreignId('website_id')->constrained()->onDelete('cascade');
            $table->string('name');
            $table->jsonb('conditions'); // e.g., {"keywords": ["pricing", "cost"], "pages": ["/pricing"]}
            $table->text('response');
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        // Create indexes for better performance
        Schema::table('auto_reply_rules', function (Blueprint $table) {
            $table->index('website_id');
            $table->index('is_active');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('auto_reply_rules');
    }
};
