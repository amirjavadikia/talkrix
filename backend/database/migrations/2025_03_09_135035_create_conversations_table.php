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
        Schema::create('conversations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('website_id')->constrained()->onDelete('cascade');
            $table->foreignId('visitor_id')->constrained()->onDelete('cascade');
            $table->foreignId('agent_id')->nullable()->constrained()->onDelete('set null');
            $table->string('status')->default('active');  // active, closed, archived
            $table->timestamp('first_message')->useCurrent();
            $table->timestamp('last_message')->useCurrent();
            $table->timestamp('ended_at')->nullable();
            $table->jsonb('metadata')->default('{}');
            $table->timestamps();
        });

        // Create indexes for better performance
        Schema::table('conversations', function (Blueprint $table) {
            $table->index('website_id');
            $table->index('visitor_id');
            $table->index('agent_id');
            $table->index('status');
            $table->index('last_message');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('conversations');
    }
};
